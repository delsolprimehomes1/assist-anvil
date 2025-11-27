import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Forwarding question to n8n webhook:', question);

    // Forward request to n8n webhook using GET with query parameter
    const webhookUrl = new URL('https://n8n2.a3innercircle.com/webhook/6ebdb724-be3e-493b-87ae-edcfb94856c9');
    webhookUrl.searchParams.append('question', question);
    
    const response = await fetch(webhookUrl.toString(), {
      method: 'GET',
    });

    console.log('n8n webhook response status:', response.status);
    console.log('n8n webhook response headers:', Object.fromEntries(response.headers.entries()));
    
    // Get response as text first to see what we're dealing with
    const responseText = await response.text();
    console.log('n8n webhook raw response:', responseText);

    if (!response.ok) {
      console.error('n8n webhook error:', response.status, responseText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 500) {
        return new Response(
          JSON.stringify({ error: 'Server error. Please try again.' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      return new Response(
        JSON.stringify({ error: `Request failed: ${response.status}` }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('n8n webhook response parsed successfully');
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      console.error('Response text was:', responseText);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from webhook',
          details: responseText.substring(0, 200) // First 200 chars for debugging
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in rag-query function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
