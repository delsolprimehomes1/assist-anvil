
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to sanitize text
function sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

// Simple text splitter since LangChain Deno support can be flaky with some deps
function splitTextRecursive(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 100
): string[] {
    if (text.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // If we are not at the end, search for the last period or newline to break gracefully
        if (endIndex < text.length) {
            const lastPeriod = text.lastIndexOf('.', endIndex);
            const lastNewline = text.lastIndexOf('\n', endIndex);
            const breakPoint = Math.max(lastPeriod, lastNewline);

            if (breakPoint > startIndex) {
                endIndex = breakPoint + 1;
            }
        }

        chunks.push(text.slice(startIndex, endIndex).trim());
        startIndex = endIndex - overlap;
    }

    return chunks;
}


serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const { guideline_id } = await req.json();

        if (!guideline_id) {
            throw new Error('guideline_id is required');
        }

        // 1. Get Guideline Metadata
        console.log(`Processing guideline ID: ${guideline_id}`);
        const { data: guideline, error: fetchError } = await supabase
            .from('carrier_guidelines')
            .select('*')
            .eq('id', guideline_id)
            .single();

        if (fetchError || !guideline) {
            throw new Error(`Guideline not found: ${fetchError?.message}`);
        }

        // 2. Download File
        console.log(`Downloading file: ${guideline.file_name} from URL: ${guideline.file_url}`);
        // Note: file_url is public, so we can fetch it directly. 
        // If it were private, we'd use supabase.storage.download

        const fileResponse = await fetch(guideline.file_url);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }
        const fileBuffer = await fileResponse.arrayBuffer();

        // 3. Extract Text
        let rawText = "";
        // Note: Deno pdf-parse wrapper might need specific handling or a different lib if it fails.
        // For simplicity in this env, we try a robust approach or fallback.

        const fileExt = guideline.file_name.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
            const pdfData = await pdfParse(new Uint8Array(fileBuffer));
            rawText = pdfData.text;
        } else if (fileExt === 'txt' || fileExt === 'md') {
            rawText = new TextDecoder().decode(fileBuffer);
        } else {
            // DOCX requires Mammoth or similar, adding that complexity might be risky in Deno Edge 
            // without import maps matching exact versions.
            // For now, let's assume PDF is primary, and if DOCX fails we note it.
            throw new Error(`Unsupported file type for processing: ${fileExt} (Currently supports PDF, TXT)`);
        }

        if (!rawText || rawText.length === 0) {
            throw new Error("Extracted text is empty");
        }

        console.log(`Extracted ${rawText.length} characters.`);

        // 4. Create Chunks
        const chunks = splitTextRecursive(sanitizeText(rawText), 1000, 200);
        console.log(`Created ${chunks.length} chunks.`);

        // 5. Generate Embeddings & Store
        // OpenAI recommends batching, but we must stay under token limits.
        // Let's do batches of 10.
        const batchSize = 10;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);

            console.log(`Generating embeddings for batch ${i / batchSize + 1}...`);

            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-large",
                input: batchChunks.map(c => c.replace(/\n/g, ' ')),
            });

            // Prepare insert data
            const insertData = batchChunks.map((chunk, idx) => ({
                guideline_id: guideline.id,
                chunk_text: chunk,
                chunk_index: i + idx,
                section_title: "General Content", // Advanced parsing in Phase 3
                page_number: 1, // Need better PDF parser for per-page extraction
                embedding: embeddingResponse.data[idx].embedding,
                metadata: {
                    source: guideline.file_name,
                    carrier: guideline.carrier_name,
                    product: guideline.product_type
                }
            }));

            const { error: insertError } = await supabase
                .from('guideline_chunks')
                .insert(insertData);

            if (insertError) throw insertError;
        }

        // 6. Update Status
        const { error: updateError } = await supabase
            .from('carrier_guidelines')
            .update({
                status: 'active',
                processing_error: null
            })
            .eq('id', guideline_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                message: 'Guideline processing complete',
                chunks_count: chunks.length
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Processing Error:", error);

        // Attempt to update status to error
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // We might not have parsed guideline_id successfully if it failed early
            // But if we did, try to save the error
            const reqJson = await req.clone().json().catch(() => null);
            if (reqJson?.guideline_id) {
                await supabase
                    .from('carrier_guidelines')
                    .update({
                        status: 'error',
                        processing_error: error.message
                    })
                    .eq('id', reqJson.guideline_id);
            }
        } catch (e) {
            console.error("Failed to update error status", e);
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
