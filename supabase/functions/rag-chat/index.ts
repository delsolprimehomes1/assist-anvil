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
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const { messages, session_id } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            throw new Error('messages array is required');
        }

        const lastMessage = messages[messages.length - 1];
        const query = lastMessage.content;

        console.log(`Chat Query: "${query}"`);

        // 1. Query Parsing Configuration
        const extractionTools = [
            {
                type: "function",
                function: {
                    name: "extract_search_filters",
                    description: "Extract underwriting criteria from the user query.",
                    parameters: {
                        type: "object",
                        properties: {
                            age: {
                                type: "integer",
                                description: "The age of the applicant."
                            },
                            coverage_amount: {
                                type: "number",
                                description: "The coverage amount requested."
                            },
                            state: {
                                type: "string",
                                description: "The 2-letter state code (e.g., CA, NY)."
                            },
                            conditions: {
                                type: "array",
                                items: { type: "string" },
                                description: "List of medical conditions mentioned."
                            },
                            gender: {
                                type: "string",
                                enum: ["male", "female"],
                                description: "The gender of the applicant."
                            }
                        },
                        required: []
                    }
                }
            }
        ];

        // 2. Perform Extraction (Query Parsing)
        console.log("Parsing query for entities...");
        const parseCompletion = await openai.chat.completions.create({
            model: "gpt-4-0125-preview",
            messages: [{ role: "user", content: query }],
            tools: extractionTools,
            tool_choice: "auto",
        });

        let filters = {
            age: null,
            coverage_amount: null,
            state: null,
            conditions: [],
            gender: null
        };

        const toolCall = parseCompletion.choices[0]?.message?.tool_calls?.[0];
        if (toolCall && toolCall.function.name === "extract_search_filters") {
            try {
                const args = JSON.parse(toolCall.function.arguments);
                console.log("Extracted Filters:", args);
                filters = { ...filters, ...args };
            } catch (e) {
                console.error("Failed to parse tool arguments:", e);
            }
        } else {
            console.log("No filters extracted.");
        }

        // 3. Generate Embedding for vector search (using text-embedding-3-small for 1536 dimensions)
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query.replace(/\n/g, ' '),
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        // 4. Retrieve Relevant Context (Hybrid Search)
        const matchCount = 8;
        const { data: chunks, error: rpcError } = await supabase.rpc('match_guideline_chunks', {
            query_embedding: queryEmbedding,
            match_threshold: 0.3,
            match_count: matchCount,
            filter_carrier_id: null,
            filter_age: filters.age,
            filter_coverage: filters.coverage_amount
        });

        if (rpcError) throw rpcError;

        console.log(`Retrieved ${chunks?.length || 0} chunks.`);

        // 5. Confidence Scoring
        let confidenceScore = 0;
        if (chunks && chunks.length > 0) {
            const topChunks = chunks.slice(0, 3);
            const avgSim = topChunks.reduce((sum: number, c: any) => sum + c.similarity, 0) / topChunks.length;
            const countFactor = Math.min(chunks.length, 5) / 5;
            confidenceScore = avgSim * countFactor;
            console.log(`Confidence Score: ${confidenceScore.toFixed(2)} (Avg Sim: ${avgSim.toFixed(2)}, Count: ${chunks.length})`);
        }

        // 6. Construct System Prompt with Context
        const contextText = chunks?.map((c: any) =>
            `---\nSource: ${c.carrier_name} - ${c.product_type} (${c.document_type})\nContent: ${c.content}`
        ).join('\n\n');

        const systemPrompt = `You are "The Underwriting Coach", an expert assistant for insurance agents.
    
    Stats:
    - User Query Context: ${JSON.stringify(filters)}
    - Retrieval Confidence: ${(confidenceScore * 100).toFixed(0)}%
    
    Instructions:
    1.  **Direct Answer**: Start with a direct answer to the user's specific question.
    2.  **Ranked Support**: If suggesting multiple carriers, rank them by how well they match the request based on the context provided.
    3.  **Strict Citations**: You must cite your sources significantly. Use the format: [Carrier Name, Doc Type].
    4.  **Unknowns**: If the answer is NOT in the provided guidelines, explicitly state "I cannot find specific guidance on this in the available documents." Do not Hallucinate coverage.
    5.  **Tone**: Professional, encouraging, and precise.
    
    Context Guidelines:
    ${contextText}
    `;

        // 7. Call LLM for Response
        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                for await (const chunk of completion) {
                    const text = chunk.choices[0]?.delta?.content || '';
                    if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                controller.close();
            },
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
            },
        });

    } catch (error) {
        console.error("Chat Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})