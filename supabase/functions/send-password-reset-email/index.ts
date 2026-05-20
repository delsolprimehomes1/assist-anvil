import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limit: 3 requests per email per 15 min
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 3;
const WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const stamps = (rateLimitMap.get(email) || []).filter((t) => now - t < WINDOW_MS);
  if (stamps.length >= RATE_LIMIT) {
    rateLimitMap.set(email, stamps);
    return true;
  }
  stamps.push(now);
  rateLimitMap.set(email, stamps);
  return false;
}

function buildEmailHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Reset Your Password</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f7fa;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#0F2A47 0%,#1B3A5C 100%);padding:48px 40px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;letter-spacing:-0.5px;">BattersBox</h1>
          <div style="height:3px;width:60px;background:linear-gradient(90deg,#8BBAC4,#C98A3A);margin:16px auto 0;border-radius:2px;"></div>
        </td></tr>
        <tr><td style="padding:48px 40px 24px;">
          <h2 style="margin:0 0 16px;color:#0F2A47;font-size:24px;font-weight:600;">Reset your password</h2>
          <p style="margin:0 0 24px;color:#4A5568;font-size:16px;line-height:1.6;">
            We received a request to reset the password on your BattersBox account. Click the button below to choose a new password.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:32px 0;"><tr><td align="center">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#8BBAC4 0%,#6FA3AE 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(139,186,196,0.35);">
              Reset Your Password
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;color:#718096;font-size:14px;line-height:1.6;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
          </p>
          <p style="margin:16px 0 0;color:#A0AEC0;font-size:13px;line-height:1.6;word-break:break-all;">
            Or paste this link into your browser:<br/>
            <span style="color:#8BBAC4;">${resetLink}</span>
          </p>
        </td></tr>
        <tr><td style="padding:24px 40px 40px;border-top:1px solid #E2E8F0;">
          <p style="margin:0;color:#A0AEC0;font-size:12px;text-align:center;line-height:1.6;">
            Need help? Contact your administrator.<br/>
            &copy; ${new Date().getFullYear()} BattersBox. All rights reserved.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectOrigin } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isRateLimited(normalizedEmail)) {
      // Return success to avoid leaking rate-limit info
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const origin =
      typeof redirectOrigin === "string" && redirectOrigin.startsWith("http")
        ? redirectOrigin.replace(/\/$/, "")
        : "https://battersbox.ai";

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo: `${origin}/reset-password` },
    });

    if (error) {
      // User not found or other admin error — return success to prevent enumeration
      console.log(`generateLink skipped for ${normalizedEmail}: ${error.message}`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      console.error("No action_link returned from generateLink");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(resendApiKey);
    const { error: sendError } = await resend.emails.send({
      from: "BattersBox <noreply@battersbox.ai>",
      to: [normalizedEmail],
      subject: "Reset your BattersBox password",
      html: buildEmailHtml(actionLink),
    });

    if (sendError) {
      console.error("Resend error:", sendError);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Password reset email sent to ${normalizedEmail}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-password-reset-email error:", err);
    return new Response(JSON.stringify({ error: err.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
