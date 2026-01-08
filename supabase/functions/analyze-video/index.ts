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
  transcript?: string;
  action_items: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { video_url, video_data, mime_type, analysis_type, custom_prompt } = await req.json();

    if (!video_url && !video_data) {
      return new Response(
        JSON.stringify({ error: "Either video_url or video_data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Video analysis service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting video analysis:", { analysis_type, has_url: !!video_url, has_data: !!video_data });

    // Get the video data as bytes
    let videoBuffer: ArrayBuffer;
    let detectedMimeType = mime_type || "video/mp4";

    if (video_data) {
      // Convert base64 to ArrayBuffer
      // Handle data URL format: "data:video/mp4;base64,..."
      let base64Data = video_data;
      if (video_data.includes(",")) {
        const parts = video_data.split(",");
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          detectedMimeType = mimeMatch[1];
        }
        base64Data = parts[1];
      }
      
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      videoBuffer = bytes.buffer;
      console.log("Using provided base64 video data, size:", Math.round(videoBuffer.byteLength / 1024), "KB");
    } else if (video_url) {
      console.log("Fetching video from URL:", video_url);
      
      try {
        const videoResponse = await fetch(video_url);
        if (!videoResponse.ok) {
          throw new Error(`Failed to fetch video: ${videoResponse.status}`);
        }
        
        const contentType = videoResponse.headers.get("content-type");
        if (contentType && contentType.startsWith("video/")) {
          detectedMimeType = contentType.split(";")[0];
        }
        
        videoBuffer = await videoResponse.arrayBuffer();
        console.log("Video fetched, size:", Math.round(videoBuffer.byteLength / 1024), "KB");
      } catch (fetchError) {
        console.error("Error fetching video:", fetchError);
        return new Response(
          JSON.stringify({ error: "Could not fetch video from URL. Please try uploading the file directly." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "No video provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Upload video to Gemini File API
    console.log("Uploading video to Gemini File API...");
    
    const uploadResponse = await fetch(
      `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "X-Goog-Upload-Protocol": "raw",
          "Content-Type": detectedMimeType,
        },
        body: videoBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("File upload failed:", uploadResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to upload video for analysis" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uploadResult = await uploadResponse.json();
    const fileUri = uploadResult.file?.uri;
    const fileMimeType = uploadResult.file?.mimeType || detectedMimeType;

    if (!fileUri) {
      console.error("No file URI in upload response:", uploadResult);
      return new Response(
        JSON.stringify({ error: "Failed to get file reference after upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Video uploaded successfully:", { fileUri, fileMimeType });

    // Poll for file to become ACTIVE
    const fileName = uploadResult.file?.name;
    if (!fileName) {
      console.error("No file name in upload response:", uploadResult);
      return new Response(
        JSON.stringify({ error: "Failed to get file name after upload" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Waiting for file to become ACTIVE...");
    let fileState = "PROCESSING";
    let pollAttempts = 0;
    const maxPollAttempts = 30; // Max 60 seconds (30 * 2 seconds)
    
    while (fileState !== "ACTIVE" && pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const fileStatusResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`
      );
      
      if (fileStatusResponse.ok) {
        const fileStatus = await fileStatusResponse.json();
        fileState = fileStatus.state;
        console.log(`File state (attempt ${pollAttempts + 1}): ${fileState}`);
        
        if (fileState === "FAILED") {
          return new Response(
            JSON.stringify({ error: "Video processing failed. Please try a different video." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      pollAttempts++;
    }

    if (fileState !== "ACTIVE") {
      return new Response(
        JSON.stringify({ error: "Video processing timed out. Please try a shorter video." }),
        { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("File is ACTIVE, proceeding with analysis...");

    // Build the prompt based on analysis type
    let userPrompt = custom_prompt || "";
    
    if (analysis_type === "key_moments") {
      userPrompt = `Analyze this video and identify the key moments. For each key moment, provide:
- A timestamp in MM:SS format
- A brief title
- A description of what happens
- The importance level (high, medium, or low)

Return the response as a JSON object with this exact structure:
{
  "summary": "A brief overall summary of the video",
  "key_moments": [
    {
      "timestamp": "0:00",
      "title": "Moment title",
      "description": "What happens at this moment",
      "importance": "high"
    }
  ],
  "action_items": ["Any action items or takeaways from the video"]
}`;
    } else if (analysis_type === "transcript") {
      userPrompt = `Please transcribe the audio from this video as accurately as possible. Include speaker identification if there are multiple speakers.

Return the response as a JSON object with this exact structure:
{
  "summary": "A brief summary of what was discussed",
  "key_moments": [],
  "transcript": "The full transcript of the video",
  "action_items": []
}`;
    } else if (analysis_type === "summary") {
      userPrompt = `Provide a comprehensive summary of this video. Include:
- Main topics covered
- Key points and insights
- Any conclusions or recommendations

Return the response as a JSON object with this exact structure:
{
  "summary": "A comprehensive summary of the video content",
  "key_moments": [
    {
      "timestamp": "0:00",
      "title": "Key point",
      "description": "Description of the key point",
      "importance": "high"
    }
  ],
  "action_items": ["Action items or key takeaways"]
}`;
    } else {
      // Custom analysis
      userPrompt = custom_prompt + `

Return the response as a JSON object with this structure:
{
  "summary": "Your analysis summary",
  "key_moments": [
    {
      "timestamp": "0:00",
      "title": "Notable moment",
      "description": "Description",
      "importance": "medium"
    }
  ],
  "action_items": ["Any action items or takeaways"]
}`;
    }

    // Step 2: Generate content with the uploaded file
    console.log("Sending analysis request to Gemini...");
    
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  file_data: {
                    file_uri: fileUri,
                    mime_type: fileMimeType,
                  },
                },
                {
                  text: userPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error("Gemini API error:", generateResponse.status, errorText);
      
      if (generateResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Video analysis failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const generateResult = await generateResponse.json();
    console.log("Gemini response received");

    // Extract the text content from Gemini's response
    const textContent = generateResult.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.error("No text content in Gemini response:", JSON.stringify(generateResult));
      return new Response(
        JSON.stringify({ error: "No analysis results returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let analysisResult: VideoAnalysisResponse;
    try {
      analysisResult = JSON.parse(textContent);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", textContent);
      // Try to extract JSON from the response
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          analysisResult = JSON.parse(jsonMatch[0]);
        } catch {
          // Return raw text as summary
          analysisResult = {
            summary: textContent,
            key_moments: [],
            action_items: [],
          };
        }
      } else {
        analysisResult = {
          summary: textContent,
          key_moments: [],
          action_items: [],
        };
      }
    }

    console.log("Analysis complete:", {
      has_summary: !!analysisResult.summary,
      key_moments_count: analysisResult.key_moments?.length || 0,
      has_transcript: !!analysisResult.transcript,
      action_items_count: analysisResult.action_items?.length || 0,
    });

    return new Response(
      JSON.stringify(analysisResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Video analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
