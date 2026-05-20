import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALWAYS_NOTIFY = ["admin@lifecoimo.com"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { userName, userEmail, phone, agencyName, signupSource, ...rest } = body ?? {};

    if (!userName || !userEmail) {
      return new Response(JSON.stringify({ error: "Missing userName or userEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all admin user emails (best-effort)
    let adminEmails: string[] = [];
    try {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = (adminRoles ?? []).map((r: any) => r.user_id);
      if (adminIds.length) {
        const { data: adminProfiles } = await supabase
          .from("profiles")
          .select("email")
          .in("id", adminIds);
        adminEmails = (adminProfiles ?? [])
          .map((p: any) => p.email)
          .filter(Boolean) as string[];
      }
    } catch (e) {
      console.error("Failed to fetch admin emails:", e);
    }

    // Always include ALWAYS_NOTIFY, dedupe (case-insensitive)
    const recipients = Array.from(
      new Map(
        [...ALWAYS_NOTIFY, ...adminEmails].map((e) => [e.toLowerCase(), e])
      ).values()
    );

    const extraFields = Object.entries(rest)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(
        ([k, v]) =>
          `<p style="margin: 0 0 12px;"><strong>${k}:</strong> ${String(v)}</p>`
      )
      .join("");

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BattersBox <noreply@battersbox.ai>",
        to: recipients,
        subject: `New Sign-Up: ${userName} is waiting for portal access`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 30px; text-align: center;">
              <h1 style="color: #8BBAC4; margin: 0 0 10px;">New Portal Access Request</h1>
              <p style="color: #ccc; margin: 0;">Someone just signed up for BattersBox</p>
            </div>
            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-top: 16px;">
              <p style="margin: 0 0 12px;"><strong>Name:</strong> ${userName}</p>
              <p style="margin: 0 0 12px;"><strong>Email:</strong> ${userEmail}</p>
              ${phone ? `<p style="margin: 0 0 12px;"><strong>Phone:</strong> ${phone}</p>` : ""}
              ${agencyName ? `<p style="margin: 0 0 12px;"><strong>Agency:</strong> ${agencyName}</p>` : ""}
              ${signupSource ? `<p style="margin: 0 0 12px;"><strong>Source:</strong> ${signupSource}</p>` : ""}
              ${extraFields}
              <p style="color: #666; margin: 16px 0 0;">Log in to the admin dashboard to review and approve this user.</p>
            </div>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();
    return new Response(JSON.stringify({ success: true, recipients, data: emailData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in notify-admin-signup:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
