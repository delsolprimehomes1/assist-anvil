import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatObjectAsMarkdown(obj: Record<string, any>): string {
  const lines: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal/metadata fields
    if (key.startsWith('_')) continue;
    
    // Format key as bold header
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    
    if (Array.isArray(value)) {
      lines.push(`**${formattedKey}:**`);
      value.forEach(item => lines.push(`- ${item}`));
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`**${formattedKey}:**`);
      lines.push(formatObjectAsMarkdown(value));
    } else {
      lines.push(`**${formattedKey}:** ${value}`);
    }
    lines.push(''); // Add spacing
  }
  
  return lines.join('\n');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, sessionId } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const webhookUrl = 'https://n8n2.a3innercircle.com/webhook/5acaff1d-18ef-449b-a1df-35fd1748cb8d';
    const payload = {
      question,
      sessionId: sessionId || crypto.randomUUID(),
      webhookUrl,
      executionMode: 'production'
    };

    console.log('Forwarding to n8n webhook with payload:', payload);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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

    // Check for empty response
    if (!responseText || responseText.trim() === '') {
      console.error('n8n webhook returned empty response');
      return new Response(
        JSON.stringify({ 
          error: 'No response from webhook',
          details: 'The webhook returned an empty response. This may indicate the workflow is not properly configured or the question could not be processed.'
        }),
        {
          status: 500,
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
          details: `Expected JSON but received: ${responseText.substring(0, 200)}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Smart response normalization
    let outputText = '';
    const possibleFields = ['output', 'answer', 'response', 'text', 'message', 'result', 'content', 'myField'];

    if (typeof data === 'string') {
      // Response is plain text
      outputText = data;
    } else if (typeof data === 'object' && data !== null) {
      // Find the first matching field
      for (const field of possibleFields) {
        if (data[field] && typeof data[field] === 'string') {
          outputText = data[field];
          break;
        }
      }
      
      // If no matching field found, format the entire object as readable markdown
      if (!outputText) {
        outputText = formatObjectAsMarkdown(data);
      }
    }

    // Format the response using OpenAI
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured, returning unformatted response');
      const normalizedResponse = {
        output: outputText || 'No response received',
        sources: data.sources || []
      };
      return new Response(JSON.stringify(normalizedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Formatting response with OpenAI...');
    
    const formattingPrompt = `You are a response formatter for an insurance knowledge assistant.
Take the provided information and restructure it into a clear, well-spaced format.

STRUCTURE (use this exact order with sections separated by blank lines):

## ✅ Summary
[1-2 sentence overview]

## 📋 Key Points

- **Point 1**: Explanation here

- **Point 2**: Explanation here

- **Point 3**: Explanation here

## 📖 Details

### [Subtopic if needed]
[Detailed explanation with short paragraphs]

## 📄 Citations & Sources

> "[Direct quote from source document if available]"

**📚 Citation Info:**
- **Document:** [Name of document/guide]
- **Page/Section:** [Page number or section if mentioned in the source]
- **Carrier:** [Insurance carrier name if applicable]

## 💡 Recommendation
[Actionable next step]

CRITICAL FORMATTING RULES:
1. Add TWO blank lines between each major ## section for visual separation
2. Add ONE blank line between each bullet point in lists
3. Use > blockquote format for any direct quotes from sources
4. Always include the Citations section if any documents or sources are referenced
5. Use **bold** for document names, carrier names, and key terms
6. Keep paragraphs short (2-3 sentences max)
7. Do NOT use --- horizontal rules (the styling handles section breaks)

Do not invent information. Only format what was provided.`;

    try {
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: formattingPrompt },
            { role: 'user', content: `Format this response:\n\n${outputText}` }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error('OpenAI formatting error:', aiResponse.status);
        // Fall back to unformatted response
        const normalizedResponse = {
          output: outputText || 'No response received',
          sources: data.sources || []
        };
        return new Response(JSON.stringify(normalizedResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiData = await aiResponse.json();
      const formattedOutput = aiData.choices?.[0]?.message?.content || outputText;

      console.log('Response formatted successfully');

      const normalizedResponse = {
        output: formattedOutput,
        sources: data.sources || []
      };

      console.log('Returning formatted response');

      return new Response(JSON.stringify(normalizedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (formatError) {
      console.error('Error formatting response with OpenAI:', formatError);
      // Fall back to unformatted response
      const normalizedResponse = {
        output: outputText || 'No response received',
        sources: data.sources || []
      };
      return new Response(JSON.stringify(normalizedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
