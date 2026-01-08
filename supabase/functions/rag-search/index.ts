
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

        // Use anon key for search (RLS should handle access, though mostly public/authenticated read)
        // Or service role if we need to bypass stringent RLS for system search
        // Using service role here for simplicity in this system-level search
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const { query, age, coverage_amount, carrier_id } = await req.json();

        if (!query) {
            throw new Error('query is required');
        }

        console.log(`Searching for: "${query}" with filters: age=${age}, coverage=${coverage_amount}`);

        // 1. Generate Query Embedding (using text-embedding-3-small for 1536 dimensions)
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query.replace(/\n/g, ' '),
        });

        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 2. Call RPC Function
        const { data: chunks, error: rpcError } = await supabase.rpc('match_guideline_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3, // Similarity threshold (1 - distance)
            match_count: 10,
            filter_carrier_id: carrier_id || null,
            filter_age: age ? parseInt(age) : null,
            filter_coverage: coverage_amount ? parseFloat(coverage_amount) : null
        });

        if (rpcError) throw rpcError;

        // 3. Return Results
        return new Response(
            JSON.stringify({
                results: chunks
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error("Search Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
