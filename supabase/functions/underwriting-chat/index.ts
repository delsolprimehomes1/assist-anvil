import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────

async function embedQuery(text: string): Promise<number[]> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini embed error (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.embedding.values;
}

async function queryPinecone(
  vector: number[],
  topK = 12
): Promise<{ text: string; carrier: string; section: string; score: number }[]> {
  const PINECONE_API_KEY = Deno.env.get("PINECONE_API_KEY")!;
  const PINECONE_INDEX_URL = Deno.env.get("PINECONE_INDEX_URL")!;

  const res = await fetch(`${PINECONE_INDEX_URL}/query`, {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      vector,
      topK,
      includeMetadata: true,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Pinecone query error (${res.status}): ${t}`);
  }

  const data = await res.json();
  return (data.matches || []).map((m: any) => ({
    text: m.metadata?.text || "",
    carrier: m.metadata?.carrier || "Unknown",
    section: m.metadata?.section || "General",
    score: m.score,
  }));
}

function buildSystemPrompt(chunks: { text: string; carrier: string; section: string; score: number }[]) {
  const context = chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}: ${c.carrier} — ${c.section} (relevance: ${(c.score * 100).toFixed(0)}%)]\n${c.text}`
    )
    .join("\n\n---\n\n");

  return `You are an expert insurance underwriting advisor. You give clean, accurate, direct answers.

STRICT OUTPUT RULES:
- Never contradict yourself. If you catch an error mid-answer, start over internally before responding.
- Lead with the correct answer in the first sentence. Never correct yourself after the fact.
- Only answer what was asked. Do not include policy fees, riders, minimums, state exceptions, or premium structure unless the agent specifically asks.
- One recommended carrier and product maximum unless the question asks for alternatives.
- Cite only the sections you actually used. Do not list every chunk retrieved.
- If the context contains conflicting information, state the correct rule and explain the conflict in one sentence.

RESPONSE FORMAT:
**Answer:** [Direct answer in one sentence]

**Details:**
[Only the rules directly relevant to the question — age bands, decision, timeframe if applicable]

**Source:** [Carrier name — Section name]

## Carrier Guidelines Context
${context}`;
}

// ── Main Handler ─────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, messages: history = [] } = await req.json();

    if (!question) {
      return new Response(JSON.stringify({ error: "question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Embed the query
    const queryVector = await embedQuery(question);

    // 2. Search Pinecone
    const chunks = await queryPinecone(queryVector, 12);
    console.log(`Pinecone returned ${chunks.length} matches`);

    // Build sources for the response
    const sources = [...new Set(chunks.map((c) => c.carrier))].map((carrier) => ({
      carrier,
      sections: [...new Set(chunks.filter((c) => c.carrier === carrier).map((c) => c.section))],
    }));

    // 3. Call Claude via Anthropic API for structured recommendation
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
    const systemPrompt = buildSystemPrompt(chunks);

    // Build conversation messages
    const claudeMessages = [
      ...history.slice(-6).map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: question },
    ];

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: claudeMessages,
        stream: true,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("Claude API error:", claudeRes.status, errText);
      throw new Error(`Claude API error (${claudeRes.status})`);
    }

    // 4. Transform Anthropic SSE to OpenAI-compatible SSE format for the frontend
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "content_block_delta" && event.delta?.text) {
              // Convert to OpenAI SSE format
              const openaiChunk = {
                choices: [{ delta: { content: event.delta.text } }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(openaiChunk)}\n\n`));
            }

            if (event.type === "message_stop") {
              // Append sources as a final message
              const sourcesText = `\n\n---\n**Sources consulted:** ${sources.map((s) => `${s.carrier} (${s.sections.join(", ")})`).join(" • ")}`;
              const sourceChunk = {
                choices: [{ delta: { content: sourcesText } }],
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourceChunk)}\n\n`));
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            }
          } catch {
            // Skip malformed lines
          }
        }
      },
    });

    const stream = claudeRes.body!.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("underwriting-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Chat failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
