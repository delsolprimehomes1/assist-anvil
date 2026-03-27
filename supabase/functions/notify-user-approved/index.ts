const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userName, userEmail } = await req.json();
    if (!userName || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing userName or userEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BattersBox <noreply@battersbox.com>",
        to: [userEmail],
        subject: "You're Approved! Welcome to BattersBox 🎉",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; text-align: center;">
              <h1 style="color: #8BBAC4; margin: 0 0 10px;">Welcome to BattersBox! 🎉</h1>
              <p style="color: #ccc; margin: 0;">Your portal access has been approved</p>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-top: 16px;">
              <p style="margin: 0 0 12px;">Hey ${userName || "there"},</p>
              <p style="margin: 0 0 12px;">Great news — your BattersBox portal access has been approved! You now have full access to all the tools, training, and resources available to you.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://battersbox.lovable.app/auth" style="display: inline-block; background: #8BBAC4; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">Log In Now</a>
              </div>
              <p style="color: #666; margin: 0;">If you have any questions, reach out to us at support@battersbox.com.</p>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    return new Response(JSON.stringify({ success: true, data: emailData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notify-user-approved:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
