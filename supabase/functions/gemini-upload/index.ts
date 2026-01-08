import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { GoogleAIFileManager } from "https://esm.sh/@google/generative-ai@0.21.0/server";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const geminiApiKey = Deno.env.get("GEMINI_API_KEY")!;

        if (!geminiApiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { guideline_id } = await req.json();

        if (!guideline_id) {
            throw new Error("guideline_id is required");
        }

        console.log(`Starting Gemini upload for guideline: ${guideline_id}`);

        // 1. Get guideline metadata
        const { data: guideline, error: fetchError } = await supabase
            .from("carrier_guidelines")
            .select("*")
            .eq("id", guideline_id)
            .single();

        if (fetchError || !guideline) {
            throw new Error(`Guideline not found: ${fetchError?.message}`);
        }

        // 2. Update status to uploading
        await supabase
            .from("carrier_guidelines")
            .update({ status: "uploading" })
            .eq("id", guideline_id);

        // 3. Download file from Supabase Storage
        // Logic to handle potential paths (similar to previous audit fix)
        let filePath = guideline.file_path;
        if (!filePath && guideline.file_url) {
            // Fallback extraction
            try {
                const urlObj = new URL(guideline.file_url);
                const parts = urlObj.pathname.split('/carrier-guidelines/');
                if (parts.length > 1) filePath = decodeURIComponent(parts[1]);
            } catch { /* ignore */ }
        }

        if (!filePath) {
            throw new Error("Could not determine file path for download.");
        }

        console.log(`Downloading file: ${filePath}`);
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("carrier-guidelines")
            .download(filePath);

        if (downloadError || !fileData) {
            throw new Error(`Failed to download file: ${downloadError?.message}`);
        }

        // 4. Convert Blob to Buffer for Gemini
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // 5. Upload to Gemini File API
        console.log(`Uploading to Gemini File API...`);
        const fileManager = new GoogleAIFileManager(geminiApiKey);

        // Create a temporary file to upload
        // Sanitize filename to be safe
        const safeMsgName = guideline.file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const tempFilePath = `/tmp/${safeMsgName}`;
        await Deno.writeFile(tempFilePath, buffer);

        const uploadResult = await fileManager.uploadFile(tempFilePath, {
            mimeType: "application/pdf", // Asking standard mime type, could derive from file
            displayName: `${guideline.carrier_name} - ${guideline.product_type}`,
        });

        console.log(`Uploaded to Gemini: ${uploadResult.file.uri}`);

        // Clean up temp file
        await Deno.remove(tempFilePath);

        // 6. Update database with Gemini file reference
        const { error: updateError } = await supabase
            .from("carrier_guidelines")
            .update({
                status: "active",
                gemini_file_uri: uploadResult.file.uri,
                gemini_file_name: uploadResult.file.name,
                gemini_uploaded_at: new Date().toISOString(),
            })
            .eq("id", guideline_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                success: true,
                gemini_file_uri: uploadResult.file.uri,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Gemini upload error:", error);

        // Update status to error
        try {
            // Re-init client to be safe inside catch
            const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
            const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // We need guideline_id from somewhere or parse again, but local vars might be lost? 
            // Actually we are in the same scope, but let's re-parse request if needed or use variable if set.
            // Error handling is tricky if we failed before guideline_id was read. 
            // But usually it fails later.
            // We'll rely on the earlier check.
            // If we have guideline_id (from scope), use it.

            // Need to access guideline_id from the try block scope. 
            // We can't easily unless we declared it outside interactively. 
            // Simplified: We accept we might not update status if we failed very early.
            // But let's try to grab it from the json body clone if possible in a real scenario.
            // For this code, I'll skip complex recovery for simplicity unless the user explicitly demanded robust error recovery in the update.
            // The user code snippet had a decent try-catch with req.clone().

            const reqJson = await req.clone().json().catch(() => null);
            if (reqJson?.guideline_id) {
                await supabase
                    .from("carrier_guidelines")
                    .update({ status: "error", processing_error: error.message }) // Added processing_error reuse (even if deprecated, useful for UI)
                    .eq("id", reqJson.guideline_id);
            }
        } catch (e) {
            console.error("Failed to update error status", e);
        }

        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
