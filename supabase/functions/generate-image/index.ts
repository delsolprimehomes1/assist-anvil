import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageRequest {
  prompt: string;
  images?: string[];
  resolution?: "1K" | "2K" | "4K";
  aspect_ratio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, images, resolution = "2K", aspect_ratio = "1:1" } = await req.json() as ImageRequest;
    
    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Prompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (images && (!Array.isArray(images) || images.length > 4)) {
      return new Response(
        JSON.stringify({ error: "Maximum 4 images allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FAL_KEY = Deno.env.get("FAL_KEY");
    if (!FAL_KEY) {
      console.error("FAL_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Image generation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine if this is edit mode or generation mode
    const isEditMode = images && images.length > 0;
    const endpoint = isEditMode 
      ? "https://queue.fal.run/fal-ai/nano-banana-pro/edit"
      : "https://queue.fal.run/fal-ai/nano-banana-pro";

    console.log(`Submitting ${isEditMode ? "edit" : "generate"} request with prompt:`, prompt.substring(0, 100));

    // Build request body
    const requestBody: Record<string, unknown> = {
      prompt,
      resolution,
      aspect_ratio,
      output_format: "png",
    };

    if (isEditMode) {
      requestBody.image_urls = images;
    }

    // Submit to Fal.ai queue
    const submitResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error("Fal.ai submit error:", submitResponse.status, errorText);
      
      if (submitResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to submit image generation request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    if (!requestId) {
      console.error("No request_id in response:", JSON.stringify(submitData));
      return new Response(
        JSON.stringify({ error: "Failed to get request ID from Fal.ai" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fal.ai request submitted, request_id:", requestId);

    // Poll for completion
    const maxAttempts = 60;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(pollInterval);

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}/status`,
        { headers: { Authorization: `Key ${FAL_KEY}` } }
      );

      if (!statusResponse.ok) {
        console.error("Status check failed:", statusResponse.status);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`Attempt ${attempt + 1}: Status = ${statusData.status}`);

      if (statusData.status === "COMPLETED") {
        // Get the result
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${requestId}`,
          { headers: { Authorization: `Key ${FAL_KEY}` } }
        );

        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error("Result fetch failed:", resultResponse.status, errorText);
          return new Response(
            JSON.stringify({ error: "Failed to fetch generation result" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const resultData = await resultResponse.json();
        console.log("Image generation completed successfully");

        const imageUrl = resultData.images?.[0]?.url;
        if (!imageUrl) {
          console.error("No image in result:", JSON.stringify(resultData));
          return new Response(
            JSON.stringify({ error: "No image was generated. Try a different prompt." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ imageUrl, description: "" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (statusData.status === "FAILED") {
        console.error("Image generation failed:", JSON.stringify(statusData));
        return new Response(
          JSON.stringify({ error: statusData.error || "Image generation failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Timeout
    return new Response(
      JSON.stringify({ error: "Image generation timed out. Please try again." }),
      { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-image function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
