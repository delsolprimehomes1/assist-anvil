import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";

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
        const { question, carrier_filters, session_id } = await req.json();

        if (!question) {
            throw new Error("question is required");
        }

        console.log(`Query: "${question}"`);

        // 1. Get relevant guidelines
        let query = supabase
            .from("carrier_guidelines")
            .select("*")
            .eq("status", "active")
            .not("gemini_file_uri", "is", null);

        // Apply carrier filters if provided
        if (carrier_filters && carrier_filters.length > 0) {
            query = query.in("carrier_name", carrier_filters);
        }

        const { data: guidelines, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        if (!guidelines || guidelines.length === 0) {
            return new Response(
                JSON.stringify({
                    answer: "No active carrier guidelines found. Please upload documents first.",
                    sources: [],
                }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log(`Found ${guidelines.length} guidelines to query`);

        // 2. Build Gemini query with file references
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: `You are an expert insurance underwriting coach helping agents understand carrier guidelines.

When answering questions:
1. Be specific and cite which carrier guideline you're referencing
2. Include relevant page numbers or sections when possible
3. If multiple carriers are relevant, compare them
4. Be conversational but professional
5. If you're not sure, say so - don't make up information
6. Focus on practical guidance for insurance agents`
        });

        // Build the query with all file references
        // Note: Gemini has limits on number of files (usually 20 or so in context depending on size, but 
        // flash-exp context window is huge: 1M tokens. Should be fine for now.)
        const parts = [
            ...guidelines.map(g => ({
                fileData: {
                    mimeType: "application/pdf",
                    fileUri: g.gemini_file_uri,
                },
            })),
            {
                text: `Based on the carrier underwriting guidelines provided, please answer this question: ${question}

Include specific citations (carrier name, section/page) in your response.`
            },
        ];

        // 3. Query Gemini
        console.log("Querying Gemini...");
        const result = await model.generateContent(parts);
        const response = result.response;
        const answer = response.text();

        console.log("Gemini response received");

        // 4. Extract sources (which guidelines were referenced - broadly all in context)
        // Ideally we would know which ones were actually used, but for now we list the available sources in context.
        const sources = guidelines.map(g => ({
            carrier_name: g.carrier_name,
            product_type: g.product_type,
            document_type: g.document_type,
            file_name: g.file_name,
        }));

        // 5. Save to chat history if session provided
        if (session_id) {
            // Save user message
            await supabase.from("underwriting_messages").insert({
                chat_id: session_id,
                role: "user",
                content: question,
            });

            // Save assistant message
            await supabase.from("underwriting_messages").insert({
                chat_id: session_id,
                role: "assistant",
                content: answer,
                sources: sources,
            });
        }

        return new Response(
            JSON.stringify({
                answer,
                sources,
                guidelines_searched: guidelines.length,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Gemini query error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
