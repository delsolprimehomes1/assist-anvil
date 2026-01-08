import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
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

// Simple PDF text extraction without external dependencies
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    const bytes = new Uint8Array(buffer);
    const text: string[] = [];
    
    // Convert to string to search for text streams
    let pdfContent = '';
    for (let i = 0; i < bytes.length; i++) {
        pdfContent += String.fromCharCode(bytes[i]);
    }
    
    // Find text between BT and ET markers (PDF text objects)
    const textRegex = /BT[\s\S]*?ET/g;
    const matches = pdfContent.match(textRegex) || [];
    
    for (const match of matches) {
        // Extract text from Tj and TJ operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(match)) !== null) {
            text.push(tjMatch[1]);
        }
        
        // Extract from TJ arrays
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
    
    // Also try to find plain text streams
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(pdfContent)) !== null) {
        const streamContent = streamMatch[1];
        // Only include if it looks like readable text
        if (/^[\x20-\x7E\s]+$/.test(streamContent) && streamContent.length > 50) {
            text.push(streamContent);
        }
    }
    
    return text.join(' ').replace(/\s+/g, ' ').trim();
}

// Extract file path from storage URL with robust handling
function extractFilePathFromUrl(fileUrl: string): { encoded: string; decoded: string } | null {
    try {
        const url = new URL(fileUrl);
        const pathname = url.pathname;
        
        // Debug logging
        console.log('Extracting path from URL:', { fileUrl, pathname });
        
        // Try various storage URL patterns
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
        
        // Fallback: try simple split
        if (!filePath) {
            const parts = fileUrl.split('/carrier-guidelines/');
            if (parts.length > 1) {
                filePath = parts[1].split('?')[0]; // Remove query params
            }
        }
        
        if (!filePath) {
            console.error('Could not extract file path from URL:', fileUrl);
            return null;
        }
        
        // Return both encoded and decoded versions
        const encoded = filePath;
        const decoded = decodeURIComponent(filePath);
        
        console.log('Extracted paths:', { encoded, decoded });
        
        return { encoded, decoded };
    } catch (error) {
        console.error('Error parsing URL:', error);
        return null;
    }
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

        // 2. Download File from private bucket using storage API
        console.log('Guideline data:', { 
            file_name: guideline.file_name, 
            file_url: guideline.file_url,
            file_path: guideline.file_path 
        });
        
        let fileData: Blob | null = null;
        let downloadError: Error | null = null;
        
        // First, try using the stored file_path if available (most reliable)
        if (guideline.file_path) {
            console.log(`Attempting download using stored file_path: ${guideline.file_path}`);
            const result = await supabase.storage
                .from('carrier-guidelines')
                .download(guideline.file_path);
            
            if (result.data && !result.error) {
                fileData = result.data;
                console.log('Download successful using file_path');
            } else {
                console.log('Download with file_path failed:', result.error?.message);
            }
        }
        
        // Fall back to extracting path from URL
        if (!fileData) {
            const paths = extractFilePathFromUrl(guideline.file_url);
            
            if (!paths) {
                throw new Error(`Could not extract file path from URL: ${guideline.file_url}`);
            }
            
            // Try decoded path first (e.g., "Assurity/Term Life/file.pdf")
            console.log(`Attempting download with decoded path: ${paths.decoded}`);
            const decodedResult = await supabase.storage
                .from('carrier-guidelines')
                .download(paths.decoded);
            
            if (decodedResult.data && !decodedResult.error) {
                fileData = decodedResult.data;
                console.log('Download successful using decoded path');
            } else {
                console.log('Download with decoded path failed:', decodedResult.error?.message);
                
                // Try encoded path as fallback (e.g., "Assurity/Term%20Life/file.pdf")
                console.log(`Attempting download with encoded path: ${paths.encoded}`);
                const encodedResult = await supabase.storage
                    .from('carrier-guidelines')
                    .download(paths.encoded);
                
                if (encodedResult.data && !encodedResult.error) {
                    fileData = encodedResult.data;
                    console.log('Download successful using encoded path');
                } else {
                    console.log('Download with encoded path failed:', encodedResult.error?.message);
                    downloadError = new Error(
                        `Failed to download file. Tried paths: decoded="${paths.decoded}", encoded="${paths.encoded}". ` +
                        `Errors: decoded=${decodedResult.error?.message}, encoded=${encodedResult.error?.message}`
                    );
                }
            }
        }
        
        if (!fileData) {
            throw downloadError || new Error('Failed to download file: No data returned');
        }
        
        const fileBuffer = await fileData.arrayBuffer();
        console.log(`File downloaded successfully, size: ${fileBuffer.byteLength} bytes`);

        // 3. Extract Text
        let rawText = "";
        const fileExt = guideline.file_name.split('.').pop()?.toLowerCase();

        if (fileExt === 'pdf') {
            rawText = await extractTextFromPDF(fileBuffer);
            
            // If basic extraction fails, try a simple fallback
            if (!rawText || rawText.length < 100) {
                console.log('Basic PDF extraction yielded little text, using fallback...');
                const decoder = new TextDecoder('utf-8', { fatal: false });
                const fullText = decoder.decode(new Uint8Array(fileBuffer));
                // Extract readable ASCII text
                rawText = fullText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
            }
        } else if (fileExt === 'txt' || fileExt === 'md') {
            rawText = new TextDecoder().decode(fileBuffer);
        } else {
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
        // Using text-embedding-3-small for 1536 dimensions (within Supabase vector limits)
        const batchSize = 10;

        for (let i = 0; i < chunks.length; i += batchSize) {
            const batchChunks = chunks.slice(i, i + batchSize);

            console.log(`Generating embeddings for batch ${i / batchSize + 1}...`);

            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batchChunks.map(c => c.replace(/\n/g, ' ')),
            });

            // Prepare insert data
            const insertData = batchChunks.map((chunk, idx) => ({
                guideline_id: guideline.id,
                content: chunk,
                chunk_index: i + idx,
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