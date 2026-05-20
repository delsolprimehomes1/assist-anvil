const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIFECO_FOOTER = `
  <div style="margin-top:24px;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;font-family:Arial,sans-serif;color:#4a4a4a;font-size:13px;line-height:1.6;">
    <p style="margin:0 0 4px;color:#8BBAC4;font-weight:700;font-size:15px;">Lifeco Support</p>
    <p style="margin:0;">P. <a href="tel:+18885653178" style="color:#4a4a4a;text-decoration:none;">1-888-565-3178</a></p>
    <p style="margin:0;">E. <a href="mailto:admin@lifecoimo.com" style="color:#4a4a4a;text-decoration:none;">admin@lifecoimo.com</a></p>
    <p style="margin:0 0 14px;">W. <a href="https://lifecoimo.com/" style="color:#4a4a4a;text-decoration:none;">https://lifecoimo.com/</a></p>
    <p style="margin:0 0 18px;">
      <a href="https://leads.lifecoimo.com" style="display:inline-block;background:#C98A3A;color:#fff;text-decoration:none;padding:10px 22px;border-radius:8px;font-weight:600;font-size:13px;">Access Leads</a>
    </p>
    <p style="margin:0;color:#888;font-size:11px;line-height:1.5;">
      <strong>CONFIDENTIAL NOTICE:</strong> This email and any attachments are strictly confidential and intended exclusively for the individual or entity to whom they are addressed. Any unauthorized review, use, disclosure, copying, or distribution is strictly prohibited. If you are not the intended recipient, you are hereby notified that you must immediately cease reading this message, notify the sender, and permanently delete all copies of this communication.
    </p>
  </div>
`;

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
        from: "BattersBox <noreply@battersbox.ai>",
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
              <p style="color: #666; margin: 0;">If you have any questions, reach out to us at support@battersbox.ai.</p>
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
