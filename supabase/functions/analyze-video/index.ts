import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface KeyMoment {
  timestamp: string;
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
}

interface VideoAnalysisResponse {
  summary: string;
  key_moments: KeyMoment[];
  transcript?: Array<{ timestamp: string; text: string }>;
  action_items: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { video_url, video_data, mime_type, analysis_type, custom_prompt } = await req.json();

    if (!video_url && !video_data) {
      return new Response(
        JSON.stringify({ error: "Either video_url or video_data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting video analysis:", { analysis_type, has_url: !!video_url, has_data: !!video_data });

    // Build the system prompt based on analysis type
    let systemPrompt = `You are an expert video analyst. Analyze the provided video carefully and extract insights.`;
    
    let userPrompt = "";
    switch (analysis_type) {
      case "key_moments":
        userPrompt = `Analyze this video and identify all key moments with precise timestamps (mm:ss format). 
For each moment, provide:
- The exact timestamp when it occurs
- A short, descriptive title (5-10 words)
- A brief description of what happens
- Importance level (high, medium, or low)

Focus on transitions, important statements, visual changes, and significant content.`;
        break;
      case "summary":
        userPrompt = `Provide a comprehensive summary of this video including:
- Main topic and purpose
- Key points discussed
- Important conclusions
- Target audience
Keep the summary concise but informative (2-3 paragraphs).`;
        break;
      case "transcript":
        userPrompt = `Transcribe the spoken content of this video with timestamps. 
Format each entry as timestamp (mm:ss) followed by the spoken text.
Include all dialogue, narration, and significant audio.`;
        break;
      case "custom":
        userPrompt = custom_prompt || "Analyze this video and provide detailed insights.";
        break;
      default:
        userPrompt = `Analyze this video and provide:
1. A brief summary (2-3 sentences)
2. Key moments with timestamps
3. Action items or takeaways`;
    }

    // Build the video content for Gemini
    const videoContent: any = video_url 
      ? {
          type: "file",
          file: {
            url: video_url,
            mime_type: mime_type || "video/mp4"
          }
        }
      : {
          type: "image_url",
          image_url: {
            url: video_data
          }
        };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              videoContent,
              { type: "text", text: userPrompt }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "video_analysis_result",
              description: "Return structured video analysis results",
              parameters: {
                type: "object",
                properties: {
                  summary: { 
                    type: "string",
                    description: "Brief summary of the video content"
                  },
                  key_moments: {
                    type: "array",
                    description: "List of key moments with timestamps",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { 
                          type: "string",
                          description: "Timestamp in mm:ss format"
                        },
                        title: { 
                          type: "string",
                          description: "Short title for this moment"
                        },
                        description: { 
                          type: "string",
                          description: "Brief description of what happens"
                        },
                        importance: { 
                          type: "string",
                          enum: ["high", "medium", "low"],
                          description: "Importance level of this moment"
                        }
                      },
                      required: ["timestamp", "title", "description", "importance"]
                    }
                  },
                  transcript: {
                    type: "array",
                    description: "Transcribed content with timestamps",
                    items: {
                      type: "object",
                      properties: {
                        timestamp: { type: "string" },
                        text: { type: "string" }
                      },
                      required: ["timestamp", "text"]
                    }
                  },
                  action_items: {
                    type: "array",
                    description: "Action items or takeaways from the video",
                    items: { type: "string" }
                  }
                },
                required: ["summary", "key_moments", "action_items"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "video_analysis_result" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received:", JSON.stringify(data).slice(0, 500));

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments) as VideoAnalysisResponse;
      console.log("Parsed analysis result:", { 
        summary_length: result.summary?.length,
        key_moments_count: result.key_moments?.length,
        action_items_count: result.action_items?.length
      });
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: parse from content if no tool call
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      return new Response(JSON.stringify({ 
        summary: content,
        key_moments: [],
        action_items: []
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No analysis result returned");

  } catch (error) {
    console.error("Video analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
