import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const N8N_WEBHOOK_URL = "https://n8n2.a3innercircle.com/webhook/5acaff1d-18ef-449b-a1df-35fd1748cb8d";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, session_id, history = [] } = await req.json();
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[rag-n8n] Question: "${question.substring(0, 100)}...", Session: ${session_id}, History: ${history.length} messages`);

    // Forward to n8n webhook with conversation history
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        question, 
        sessionId: session_id,
        history: history
      }),
    });

    console.log(`[rag-n8n] n8n response status: ${n8nResponse.status}`);

    if (!n8nResponse.ok) {
      if (n8nResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await n8nResponse.text();
      console.error(`[rag-n8n] n8n error: ${errorText}`);
      throw new Error(`n8n webhook failed: ${n8nResponse.status}`);
    }

    // Try to parse as JSON first
    const responseText = await n8nResponse.text();
    console.log(`[rag-n8n] Raw response length: ${responseText.length}`);
    
    let responseContent = '';
    
    try {
      const data = JSON.parse(responseText);
      
      // Extract the response text from common n8n output formats
      if (typeof data === 'string') {
        responseContent = data;
      } else if (data.output) {
        responseContent = data.output;
      } else if (data.response) {
        responseContent = data.response;
      } else if (data.answer) {
        responseContent = data.answer;
      } else if (data.text) {
        responseContent = data.text;
      } else if (data.message) {
        responseContent = data.message;
      } else if (data.content) {
        responseContent = data.content;
      } else if (data.result) {
        responseContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2);
      } else {
        // If we can't find a known field, format the entire object nicely
        responseContent = formatObjectAsMarkdown(data);
      }
    } catch {
      // If not JSON, use the raw text
      responseContent = responseText;
    }

    console.log(`[rag-n8n] Returning response of length: ${responseContent.length}`);

    return new Response(
      JSON.stringify({ output: responseContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("[rag-n8n] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to format JSON objects as readable markdown
function formatObjectAsMarkdown(obj: Record<string, unknown>, indent = 0): string {
  const lines: string[] = [];
  const prefix = '  '.repeat(indent);
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal fields
    if (key.startsWith('_')) continue;
    
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${prefix}**${formattedKey}:**`);
      lines.push(formatObjectAsMarkdown(value as Record<string, unknown>, indent + 1));
    } else if (Array.isArray(value)) {
      lines.push(`${prefix}**${formattedKey}:**`);
      value.forEach(item => {
        if (typeof item === 'object') {
          lines.push(formatObjectAsMarkdown(item as Record<string, unknown>, indent + 1));
        } else {
          lines.push(`${prefix}  - ${item}`);
        }
      });
    } else {
      lines.push(`${prefix}**${formattedKey}:** ${value}`);
    }
  }
  
  return lines.join('\n');
}
