import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  image_url: string;
  prompt: string;
  duration?: "4s" | "6s" | "8s";
  resolution?: "720p" | "1080p";
  aspect_ratio?: "16:9" | "9:16";
  generate_audio?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      return new Response(
        JSON.stringify({ error: "Video generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: VideoRequest = await req.json();
    const { image_url, prompt, duration = "8s", resolution = "720p", aspect_ratio = "16:9", generate_audio = true } = body;

    if (!image_url || !prompt) {
      return new Response(
        JSON.stringify({ error: "image_url and prompt are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting video generation:", { prompt, duration, resolution, aspect_ratio });

    // Submit job to Fal.ai queue
    const submitResponse = await fetch("https://queue.fal.run/fal-ai/veo3/image-to-video", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_url,
        duration,
        aspect_ratio,
        generate_audio,
      }),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Fal.ai submit error:", submitResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to start video generation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;
    console.log("Job submitted, request_id:", requestId);

    // Poll for completion (max 3 minutes)
    const maxAttempts = 36;
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(`https://queue.fal.run/fal-ai/veo3/requests/${requestId}/status`, {
        headers: { Authorization: `Key ${FAL_KEY}` },
      });

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Poll attempt ${attempt + 1}:`, statusData.status);

      if (statusData.status === "COMPLETED") {
        // Get the result
        const resultResponse = await fetch(`https://queue.fal.run/fal-ai/veo3/requests/${requestId}`, {
          headers: { Authorization: `Key ${FAL_KEY}` },
        });

        if (!resultResponse.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to retrieve video result" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const resultData = await resultResponse.json();
        console.log("Video generation complete:", resultData);

        return new Response(
          JSON.stringify({
            video_url: resultData.video?.url,
            duration: resultData.video?.duration,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (statusData.status === "FAILED") {
        return new Response(
          JSON.stringify({ error: "Video generation failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Timeout - return request_id for manual checking
    return new Response(
      JSON.stringify({ 
        error: "Video generation is taking longer than expected",
        request_id: requestId,
        message: "The video is still processing. Please try again in a few minutes."
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Video generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
