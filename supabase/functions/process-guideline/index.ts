
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2.76.1'
import OpenAI from 'npm:openai'
import pdf from 'npm:pdf-parse/lib/pdf-parse.js'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function splitTextRecursive(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;
        if (endIndex < text.length) {
            const lastPeriod = text.lastIndexOf('.', endIndex);
            const lastSpace = text.lastIndexOf(' ', endIndex);
            const breakPoint = Math.max(lastPeriod, lastSpace);
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

    const startTime = Date.now();

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const { guideline_id } = await req.json();

        if (!guideline_id) throw new Error('guideline_id is required');

        // 1. Get Guideline Metadata
        const { data: guideline, error: fetchError } = await supabase
            .from('carrier_guidelines')
            .select('*')
            .eq('id', guideline_id)
            .single();

        if (fetchError || !guideline) throw new Error(`Guideline not found: ${fetchError?.message}`);

        // 2. Download File
        // Use file_path if available (preferred for storage buckets), else fallback to file_url logic if path missing
        // For signed/private buckets, we MUST use download from storage if not public.
        // Audit checklist says bucket is 'carrier-guidelines' (private).
        // So we should try to figure out the path.
        // If file_path column exists (added in our migration), use it. 
        // If not (e.g. migration not run yet, legacy), try to parse from URL or fallback to public URL (which might fail if private).

        let fileBuffer: ArrayBuffer;

        // Construct path if missing (legacy compat)
        // Format: carrier/product/timestamp_filename
        // But better to rely on what was uploaded. 
        // If file_path is null, we might need to rely on the public URL or fail.
        // Assuming migration 20260108000000_rag_audit_fix.sql is applied, file_path exists.

        let storagePath = guideline.file_path;
        if (!storagePath && guideline.file_url) {
            // Try to extract relative path from URL if possible, or just error out if strictly private
            // For this fix, let's assume valid file_path or try to download via URL if signed (but we are server side).
            // Actually, we are admin, so we can access storage directly.
            // If we don't have the path, we can't easily download from private bucket without listing.
            // Let's assume the user has set file_path or we try to download from the URL provided (if it was a signed URL passed during upload? No, upload stores public URL usually).
            // If bucket is private, file_url stored might not be accessible unless signed.
            // We will try `storage.from(...).download(path)`.
            // If path is missing, we are in trouble. 
            // Failsafe: Try to use the previous logic of fetch(url) but if it's 403, we error.

            // Simplest mitigation for legacy rows without file_path:
            try {
                const urlObj = new URL(guideline.file_url);
                const pathParts = urlObj.pathname.split('/carrier-guidelines/');
                if (pathParts.length > 1) storagePath = decodeURIComponent(pathParts[1]);
            } catch (e) {
                // ignore
            }
        }

        if (storagePath) {
            const { data: fileData, error: downloadError } = await supabase.storage
                .from('carrier-guidelines')
                .download(storagePath);
            if (downloadError) throw downloadError;
            fileBuffer = await fileData.arrayBuffer();
        } else {
            // Fallback
            const fileResponse = await fetch(guideline.file_url);
            if (!fileResponse.ok) throw new Error(`Failed to download file (Status ${fileResponse.status}). Private bucket Requires file_path.`);
            fileBuffer = await fileResponse.arrayBuffer();
        }

        // 3. Extract Text
        let rawText = "";
        const fileExt = guideline.file_name.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
            const pdfData = await pdf(Buffer.from(fileBuffer));
            rawText = pdfData.text;
        } else if (fileExt === 'docx') {
            // DOCX is tricky in Deno without specific libs. 
            // Audit requirement: "Use pdf-parse library". Doesn't explicitely forbid regex for others but implies robustness.
            // Since mammoth/others are hard to import in Deno Edge without import maps sometimes:
            // We will ERROR for DOCX for now unless we have a specific solution.
            // OR we fallback to a simple text extractor if possible.
            // Prompt says: "pdf-parse library (not just regex)" for PDF.
            // Valid MIME types include DOCX.
            // Let's treat non-PDF as text for now or throw if we strictly can't parse.
            throw new Error("DOCX parsing not yet implemented in this Edge Function version. Please convert to PDF.");
        } else {
            rawText = new TextDecoder().decode(fileBuffer);
        }

        rawText = sanitizeText(rawText);

        // 4. Enforce Limits
        const MAX_CHARS = 30000;
        let isTruncated = false;
        if (rawText.length > MAX_CHARS) {
            rawText = rawText.slice(0, MAX_CHARS);
            isTruncated = true;
        }

        if (rawText.length === 0) throw new Error("Extracted text is empty");

        // 5. Chunking
        const MAX_CHUNKS = 20;
        let chunks = splitTextRecursive(rawText, 800, 100);
        if (chunks.length > MAX_CHUNKS) {
            chunks = chunks.slice(0, MAX_CHUNKS);
            isTruncated = true;
        }

        // 6. Delete Existing Chunks (Duplicate Prevention)
        await supabase.from('guideline_chunks').delete().eq('guideline_id', guideline_id);

        // 7. Embed & Store
        const BATCH_SIZE = 5;
        let chunksProcessed = 0;

        for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
            const batch = chunks.slice(i, i + BATCH_SIZE);

            // OpenAI Embedding
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch,
                dimensions: 1536
            });

            const insertData = batch.map((chunk, idx) => ({
                guideline_id,
                chunk_index: i + idx,
                chunk_text: chunk,
                embedding: embeddingResponse.data[idx].embedding,
                metadata: {
                    source: guideline.file_name,
                    carrier: guideline.carrier_name,
                    product: guideline.product_type
                }
            }));

            const { error: insertError } = await supabase.from('guideline_chunks').insert(insertData);
            if (insertError) throw insertError;

            chunksProcessed += batch.length;
            // Batch delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 8. Update Metrics & Status
        const processingTime = Date.now() - startTime;
        const finalStatus = isTruncated ? 'partial' : 'active';
        const notes = isTruncated ? `${guideline.notes || ''} [Truncated to limits]`.trim() : guideline.notes;

        const { error: updateError } = await supabase
            .from('carrier_guidelines')
            .update({
                status: finalStatus,
                processing_error: null,
                chunks_processed_count: chunksProcessed,
                processing_time_ms: processingTime,
                last_processing_at: new Date().toISOString(),
                notes: notes
            })
            .eq('id', guideline_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                success: true,
                chunks: chunksProcessed,
                status: finalStatus,
                time_ms: processingTime
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Processing Failed:", error);

        // Attempt error status update
        try {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
            const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { guideline_id } = await req.clone().json().catch(() => ({}));

            if (guideline_id) {
                await supabase.from('carrier_guidelines').update({
                    status: 'error',
                    processing_error: error.message,
                    last_processing_at: new Date().toISOString()
                }).eq('id', guideline_id);
            }
        } catch (e) { /* ignore */ }

        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
