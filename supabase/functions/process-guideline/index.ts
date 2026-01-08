import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Track progress for shutdown handler
let processingProgress = { current: 0, total: 0, guidelineId: '' };

// Shutdown handler to log progress on unexpected termination
addEventListener('beforeunload', (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    console.log(`Shutdown: processed ${processingProgress.current}/${processingProgress.total} chunks for ${processingProgress.guidelineId}. Reason: ${detail?.reason || 'unknown'}`);
});

// Helper to sanitize text
function sanitizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

// Simple text splitter
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

// Memory-optimized PDF text extraction
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
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

// Background processing function
async function processGuidelineInBackground(guidelineId: string) {
    console.log(`[BG] Starting background processing for: ${guidelineId}`);
    processingProgress.guidelineId = guidelineId;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const openai = new OpenAI({ apiKey: openaiApiKey });

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

        // 3. Extract Text with strict limits
        let rawText = "";
        const fileExt = guideline.file_name.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
            rawText = await extractTextFromPDF(fileBuffer);
            
            // Simple fallback if extraction failed
            if (!rawText || rawText.length < 100) {
                console.log('[BG] Basic extraction failed, using fallback...');
                const decoder = new TextDecoder('utf-8', { fatal: false });
                // Only decode first 100KB for fallback
                const limitedBuffer = fileBuffer.slice(0, 100 * 1024);
                const fullText = decoder.decode(new Uint8Array(limitedBuffer));
                rawText = fullText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
            }
        } else if (fileExt === 'txt' || fileExt === 'md') {
            rawText = new TextDecoder().decode(fileBuffer);
        } else {
            throw new Error(`Unsupported file type: ${fileExt}`);
        }

        // Limit text to 50K characters max
        const MAX_TEXT = 50000;
        if (rawText.length > MAX_TEXT) {
            console.log(`[BG] Truncating text from ${rawText.length} to ${MAX_TEXT} chars`);
            rawText = rawText.substring(0, MAX_TEXT);
        }

        if (!rawText || rawText.length === 0) {
            throw new Error("Extracted text is empty");
        }

        console.log(`[BG] Extracted ${rawText.length} characters`);

        // 4. Create Chunks - limit to 30
        const allChunks = splitTextRecursive(sanitizeText(rawText), 800, 100);
        const maxChunks = 30;
        const chunks = allChunks.slice(0, maxChunks);
        
        console.log(`[BG] Processing ${chunks.length} chunks (${allChunks.length > maxChunks ? 'truncated from ' + allChunks.length : 'total'})`);
        
        processingProgress.total = chunks.length;

        // 5. Generate Embeddings & Store - ONE AT A TIME to minimize memory
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            processingProgress.current = i + 1;
            
            console.log(`[BG] Chunk ${i + 1}/${chunks.length}`);

            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: [chunk.replace(/\n/g, ' ')],
            });

            const { error: insertError } = await supabase
                .from('guideline_chunks')
                .insert({
                    guideline_id: guideline.id,
                    content: chunk,
                    chunk_index: i,
                    embedding: embeddingResponse.data[0].embedding,
                    metadata: {
                        source: guideline.file_name,
                        carrier: guideline.carrier_name,
                        product: guideline.product_type
                    }
                });

            if (insertError) throw insertError;
        }

        // 6. Update Status to active
        await supabase
            .from('carrier_guidelines')
            .update({ status: 'active', processing_error: null })
            .eq('id', guidelineId);

        console.log(`[BG] Complete! Processed ${chunks.length} chunks`);

    } catch (error) {
        console.error("[BG] Error:", error);
        
        // Update status to error
        await supabase
            .from('carrier_guidelines')
            .update({ status: 'error', processing_error: error.message })
            .eq('id', guidelineId);
    }
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const { guideline_id } = await req.json();

        if (!guideline_id) {
            throw new Error('guideline_id is required');
        }

        console.log(`Received request for guideline: ${guideline_id}`);

        // Start background processing without awaiting
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
