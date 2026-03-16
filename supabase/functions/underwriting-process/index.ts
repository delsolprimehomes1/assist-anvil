import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────

async function parseWithLlama(pdfBytes: Uint8Array, fileName: string): Promise<string> {
  const LLAMA_PARSE_API_KEY = Deno.env.get("LLAMA_PARSE_API_KEY")!;

  // 1. Upload the file
  const form = new FormData();
  form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), fileName);
  form.append("result_type", "markdown");
  form.append("auto_mode", "true");

  const uploadRes = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${LLAMA_PARSE_API_KEY}` },
    body: form,
  });

  if (!uploadRes.ok) {
    const t = await uploadRes.text();
    throw new Error(`LlamaParse upload failed (${uploadRes.status}): ${t}`);
  }

  const { id: jobId } = await uploadRes.json();
  console.log(`LlamaParse job started: ${jobId}`);

  // 2. Poll for completion (max ~5 min)
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
      headers: { Authorization: `Bearer ${LLAMA_PARSE_API_KEY}` },
    });
    const statusData = await statusRes.json();
    if (statusData.status === "SUCCESS") break;
    if (statusData.status === "ERROR") throw new Error(`LlamaParse error: ${JSON.stringify(statusData)}`);
    console.log(`LlamaParse status: ${statusData.status} (attempt ${i + 1})`);
  }

  // 3. Get markdown result
  const resultRes = await fetch(
    `https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`,
    { headers: { Authorization: `Bearer ${LLAMA_PARSE_API_KEY}` } }
  );
  if (!resultRes.ok) throw new Error(`LlamaParse result fetch failed: ${resultRes.status}`);
  const { markdown } = await resultRes.json();
  return markdown as string;
}

function chunkBySection(markdown: string, carrierName: string): { text: string; section: string }[] {
  const lines = markdown.split("\n");
  const chunks: { text: string; section: string }[] = [];
  let currentSection = "General";
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text.length > 50) {
      chunks.push({
        text: `Carrier: ${carrierName} | Section: ${currentSection}\n\n${text}`,
        section: currentSection,
      });
    }
    buffer = [];
  };

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      flush();
      currentSection = line.replace(/^#{1,3}\s*/, "").trim();
    }
    buffer.push(line);
    // Split if buffer gets very large (~2000 chars)
    if (buffer.join("\n").length > 2000) {
      flush();
    }
  }
  flush();

  return chunks;
}

async function embedTexts(texts: string[], taskType: string): Promise<number[][]> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GEMINI_API_KEY}`;

  // Process in batches of 100
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: "models/text-embedding-004",
          content: { parts: [{ text }] },
          taskType,
          outputDimensionality: 768,
        })),
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Gemini embedding error (${res.status}): ${t}`);
    }
    const data = await res.json();
    for (const emb of data.embeddings) {
      allEmbeddings.push(emb.values);
    }
  }
  return allEmbeddings;
}

async function upsertToPinecone(
  vectors: { id: string; values: number[]; metadata: Record<string, string> }[]
) {
  const PINECONE_API_KEY = Deno.env.get("PINECONE_API_KEY")!;
  const PINECONE_INDEX_URL = Deno.env.get("PINECONE_INDEX_URL")!;

  // Upsert in batches of 100
  for (let i = 0; i < vectors.length; i += 100) {
    const batch = vectors.slice(i, i + 100);
    const res = await fetch(`${PINECONE_INDEX_URL}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectors: batch }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Pinecone upsert error (${res.status}): ${t}`);
    }
    await res.json(); // consume body
    console.log(`Pinecone upserted batch ${i / 100 + 1} (${batch.length} vectors)`);
  }
}

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Expected multipart/form-data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const carrierName = formData.get("carrier_name") as string;
    const file = formData.get("file") as File;

    if (!carrierName || !file) {
      return new Response(JSON.stringify({ error: "carrier_name and file are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing: ${file.name} for carrier: ${carrierName} (${file.size} bytes)`);

    // 1. Parse PDF with LlamaParse
    const pdfBytes = new Uint8Array(await file.arrayBuffer());
    const markdown = await parseWithLlama(pdfBytes, file.name);
    console.log(`LlamaParse returned ${markdown.length} chars of markdown`);

    // 2. Chunk by section
    const chunks = chunkBySection(markdown, carrierName);
    console.log(`Created ${chunks.length} chunks`);

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ error: "No content extracted from PDF" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Generate embeddings
    const embeddings = await embedTexts(
      chunks.map((c) => c.text),
      "RETRIEVAL_DOCUMENT"
    );
    console.log(`Generated ${embeddings.length} embeddings`);

    // 4. Upsert to Pinecone
    const vectors = chunks.map((chunk, i) => ({
      id: `${carrierName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${i}`,
      values: embeddings[i],
      metadata: {
        carrier: carrierName,
        section: chunk.section,
        text: chunk.text.slice(0, 3500), // Pinecone metadata limit
        source_file: file.name,
      },
    }));

    await upsertToPinecone(vectors);

    return new Response(
      JSON.stringify({
        success: true,
        carrier: carrierName,
        chunks_processed: chunks.length,
        file_name: file.name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("underwriting-process error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
