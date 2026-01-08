import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { getDocument } from 'https://esm.sh/pdfjs-serverless'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// OPTIMIZATION 1: Reduced text limit (memory-safe)
const MAX_TEXT = 15000;
// OPTIMIZATION 3: Reduced max chunks (memory-safe)
const MAX_CHUNKS = 10;
// OPTIMIZATION 5: Time budget (8 seconds)
const BUDGET_MS = 8000;
// OPTIMIZATION 4: Batch size for embeddings (1 = lowest memory)
const EMBEDDING_BATCH_SIZE = 1;

// Track progress for shutdown handler
let processingProgress = { current: 0, total: 0, guidelineId: '', startTime: 0 };

// Shutdown handler to log progress on unexpected termination
addEventListener('beforeunload', (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    const elapsed = Date.now() - processingProgress.startTime;
    console.log(`Shutdown: processed ${processingProgress.current}/${processingProgress.total} chunks for ${processingProgress.guidelineId} in ${elapsed}ms. Reason: ${detail?.reason || 'unknown'}`);
});

// Helper to sanitize text
function sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

// Helper for delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple text splitter - OPTIMIZATION 2: 800 chunk size, 100 overlap
function splitTextRecursive(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
    if (text.length <= chunkSize) return [text];
    const chunks: string[] = [];
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

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

// Basic regex-based PDF extraction (fallback)
function extractTextBasic(buffer: ArrayBuffer): string {
    // Only process first 500KB to save memory
    const maxBytes = 500 * 1024;
    const bytes = new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, maxBytes)));
    const text: string[] = [];

    const decoder = new TextDecoder('latin1');
    const pdfContent = decoder.decode(bytes);

    // Find text between BT and ET markers (PDF text objects)
    const textRegex = /BT[\s\S]*?ET/g;
    const matches = pdfContent.match(textRegex) || [];

    for (const match of matches.slice(0, 200)) {
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(match)) !== null) {
            text.push(tjMatch[1]);
        }

        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let tjArrayMatch;
        while ((tjArrayMatch = tjArrayRegex.exec(match)) !== null) {
            const arrayContent = tjArrayMatch[1];
            const stringRegex = /\(([^)]*)\)/g;
            let stringMatch;
            while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
                text.push(stringMatch[1]);
            }
        }
    }

    // Also try to find plain text streams (limited)
    const streamRegex = /stream\s*([\s\S]{50,1000}?)\s*endstream/g;
    let streamMatch;
    let streamCount = 0;
    while ((streamMatch = streamRegex.exec(pdfContent)) !== null && streamCount < 50) {
        const streamContent = streamMatch[1];
        if (/^[\x20-\x7E\s]+$/.test(streamContent)) {
            text.push(streamContent);
        }
        streamCount++;
    }

    return text.join(' ').replace(/\s+/g, ' ').trim();
}

// PDF text extraction using pdfjs-serverless with fallback (memory-optimized)
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    const startTime = Date.now();
    const maxBytes = 500 * 1024; // 500KB limit for memory safety

    // Limit buffer size for very large files
    const limitedBuffer = buffer.byteLength > maxBytes
        ? buffer.slice(0, maxBytes)
        : buffer;

    console.log(`[BG] Starting PDF extraction (${limitedBuffer.byteLength} bytes, max ${maxBytes})`);

    try {
        // Convert ArrayBuffer to Uint8Array for pdfjs-serverless
        const data = new Uint8Array(limitedBuffer);
        const doc = await getDocument({ data, useSystemFonts: true }).promise;

        let fullText = '';
        const numPages = doc.numPages;
        console.log(`[BG] PDF has ${numPages} pages`);

        // Extract text from first 10 pages only (memory-safe)
        const maxPages = Math.min(numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n';
            
            // Release page reference for GC
            // @ts-ignore
            page.cleanup?.();
        }

        // Release doc reference for GC
        // @ts-ignore
        doc.cleanup?.();

        const elapsed = Date.now() - startTime;
        console.log(`[BG] pdfjs-serverless success: ${fullText.length} chars in ${elapsed}ms`);
        return fullText;
    } catch (err) {
        const elapsed = Date.now() - startTime;
        console.error(`[BG] pdfjs-serverless failed after ${elapsed}ms:`, err);

        // Fallback to basic extraction
        console.log('[BG] Trying basic extraction as fallback...');
        return extractTextBasic(limitedBuffer);
    }
}

// Extract file path from storage URL
function extractFilePathFromUrl(fileUrl: string): { encoded: string; decoded: string } | null {
    try {
        const url = new URL(fileUrl);
        const pathname = url.pathname;

        const patterns = [
            '/storage/v1/object/public/carrier-guidelines/',
            '/storage/v1/object/sign/carrier-guidelines/',
            '/storage/v1/object/authenticated/carrier-guidelines/',
            '/carrier-guidelines/',
        ];

        let filePath: string | null = null;

        for (const pattern of patterns) {
            const idx = pathname.indexOf(pattern);
            if (idx !== -1) {
                filePath = pathname.substring(idx + pattern.length);
                break;
            }
        }

        if (!filePath) {
            const parts = fileUrl.split('/carrier-guidelines/');
            if (parts.length > 1) {
                filePath = parts[1].split('?')[0];
            }
        }

        if (!filePath) return null;

        return { encoded: filePath, decoded: decodeURIComponent(filePath) };
    } catch {
        return null;
    }
}

// Background processing function with all optimizations
async function processGuidelineInBackground(guidelineId: string) {
    const startTime = Date.now();
    processingProgress = { current: 0, total: 0, guidelineId, startTime };

    console.log(`[BG] Starting background processing for: ${guidelineId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Lazy-load OpenAI client only when needed (after PDF extraction)
    let openai: OpenAI | null = null;

    let processedCount = 0;
    let isPartial = false;
    let partialReason = '';

    // Helper to check time budget
    const checkBudget = () => Date.now() - startTime < BUDGET_MS;
    const getElapsed = () => Date.now() - startTime;

    // Helper to update status with metrics
    const updateStatus = async (status: string, error: string | null = null) => {
        await supabase
            .from('carrier_guidelines')
            .update({
                status,
                processing_error: error,
                chunks_processed_count: processedCount,
                processing_time_ms: getElapsed(),
                last_processing_at: new Date().toISOString()
            })
            .eq('id', guidelineId);
    };

    try {
        // 1. Get Guideline Metadata
        const { data: guideline, error: fetchError } = await supabase
            .from('carrier_guidelines')
            .select('*')
            .eq('id', guidelineId)
            .single();

        if (fetchError || !guideline) {
            throw new Error(`Guideline not found: ${fetchError?.message}`);
        }

        console.log(`[BG] Processing: ${guideline.file_name}`);

        // OPTIMIZATION 7: Delete existing chunks before processing (for retries)
        const { error: deleteError } = await supabase
            .from('guideline_chunks')
            .delete()
            .eq('guideline_id', guidelineId);

        if (deleteError) {
            console.log(`[BG] Warning: Could not delete existing chunks: ${deleteError.message}`);
        }

        // 2. Download File
        let fileData: Blob | null = null;

        if (guideline.file_path) {
            const result = await supabase.storage
                .from('carrier-guidelines')
                .download(guideline.file_path);
            if (result.data && !result.error) {
                fileData = result.data;
            }
        }

        if (!fileData) {
            const paths = extractFilePathFromUrl(guideline.file_url);
            if (!paths) throw new Error('Could not extract file path');

            const result = await supabase.storage
                .from('carrier-guidelines')
                .download(paths.decoded);

            if (result.data) {
                fileData = result.data;
            } else {
                const encodedResult = await supabase.storage
                    .from('carrier-guidelines')
                    .download(paths.encoded);
                if (encodedResult.data) fileData = encodedResult.data;
            }
        }

        if (!fileData) throw new Error('Failed to download file');

        const fileBuffer = await fileData.arrayBuffer();
        console.log(`[BG] Downloaded: ${fileBuffer.byteLength} bytes`);

        // 3. Extract Text - OPTIMIZATION 1: No fallback, just basic extraction
        let rawText = "";
        const fileExt = guideline.file_name.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
            rawText = await extractTextFromPDF(fileBuffer);

            // OPTIMIZATION 1: No CPU-intensive fallback - if extraction fails, mark as error
            if (!rawText || rawText.length < 100) {
                throw new Error('PDF text extraction failed (<100 chars). Try re-uploading or use a different PDF format.');
            }
        } else if (fileExt === 'txt' || fileExt === 'md') {
            rawText = new TextDecoder().decode(fileBuffer);
        } else {
            throw new Error(`Unsupported file type: ${fileExt}`);
        }

        // OPTIMIZATION 1: Limit text to 30K characters max
        if (rawText.length > MAX_TEXT) {
            console.log(`[BG] Truncating text from ${rawText.length} to ${MAX_TEXT} chars`);
            rawText = rawText.substring(0, MAX_TEXT);
        }

        if (!rawText || rawText.length === 0) {
            throw new Error("Extracted text is empty");
        }

        console.log(`[BG] Extracted ${rawText.length} characters`);

        // 4. Create Chunks - OPTIMIZATION 3: limit to 20
        const allChunks = splitTextRecursive(sanitizeText(rawText), 800, 100);
        const truncatedChunks = allChunks.length > MAX_CHUNKS;
        const chunks = allChunks.slice(0, MAX_CHUNKS);

        if (truncatedChunks) {
            isPartial = true;
            partialReason = `Truncated from ${allChunks.length} to ${MAX_CHUNKS} chunks`;
            console.log(`[BG] ${partialReason}`);
        }

        console.log(`[BG] Processing ${chunks.length} chunks`);
        processingProgress.total = chunks.length;

        // 5. Generate Embeddings & Store - OPTIMIZATION 4: Batch of 5 with 100ms delay
        for (let batchStart = 0; batchStart < chunks.length; batchStart += EMBEDDING_BATCH_SIZE) {
            // OPTIMIZATION 5: Check time budget before each batch
            if (!checkBudget()) {
                isPartial = true;
                partialReason = `Time budget exceeded (${BUDGET_MS}ms) after ${processedCount} chunks`;
                console.log(`[BG] ${partialReason}`);
                break;
            }

            const batchEnd = Math.min(batchStart + EMBEDDING_BATCH_SIZE, chunks.length);
            const batchChunks = chunks.slice(batchStart, batchEnd);

            console.log(`[BG] Batch ${Math.floor(batchStart / EMBEDDING_BATCH_SIZE) + 1}: chunks ${batchStart + 1}-${batchEnd}`);

            // Lazy-load OpenAI client on first use (memory optimization)
            if (!openai) {
                openai = new OpenAI({ apiKey: openaiApiKey });
            }

            // Generate embeddings for batch
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batchChunks.map(c => c.replace(/\n/g, ' ')),
            });

            // Prepare batch insert
            const insertRows = batchChunks.map((chunk, idx) => ({
                guideline_id: guidelineId,
                content: chunk,
                chunk_index: batchStart + idx,
                embedding: embeddingResponse.data[idx].embedding,
                metadata: {
                    source: guideline.file_name,
                    carrier: guideline.carrier_name,
                    product: guideline.product_type,
                    // OPTIMIZATION 3: Add partial processing metadata
                    ...(truncatedChunks ? {
                        partial_processing: true,
                        truncated_to_max_chunks: true,
                        max_chunks: MAX_CHUNKS,
                        estimated_total_chunks: allChunks.length
                    } : {})
                }
            }));

            const { error: insertError } = await supabase
                .from('guideline_chunks')
                .insert(insertRows);

            if (insertError) throw insertError;

            processedCount += batchChunks.length;
            processingProgress.current = processedCount;

            // OPTIMIZATION 4: Add delay between batches (except for last batch)
            if (batchEnd < chunks.length) {
                await sleep(100);
            }
        }

        // 6. Update Status - OPTIMIZATION 6: Better error handling with metrics
        const finalStatus = isPartial ? 'partial' : 'active';
        await updateStatus(finalStatus, isPartial ? partialReason : null);

        console.log(`[BG] Complete! Status: ${finalStatus}, Processed: ${processedCount} chunks in ${getElapsed()}ms`);

    } catch (error) {
        console.error("[BG] Error:", error);

        // OPTIMIZATION 6: Update status with detailed error info
        await supabase
            .from('carrier_guidelines')
            .update({
                status: 'error',
                processing_error: error.message,
                chunks_processed_count: processedCount,
                processing_time_ms: getElapsed(),
                last_processing_at: new Date().toISOString()
            })
            .eq('id', guidelineId);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { guideline_id } = await req.json();

        if (!guideline_id) throw new Error('guideline_id is required');

        console.log(`Received request for guideline: ${guideline_id}`);

        // Start background processing without awaiting
        // @ts-ignore: EdgeRuntime is available in Supabase Edge Functions
        EdgeRuntime.waitUntil(processGuidelineInBackground(guideline_id));

        // Return immediate response
        return new Response(
            JSON.stringify({
                message: 'Processing started',
                guideline_id
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Request Error:", error);

        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})