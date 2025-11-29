import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailData {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received auth email webhook request");
    
    // Verify webhook signature
    const wh = new Webhook(hookSecret);
    const data = wh.verify(payload, headers) as AuthEmailData;
    
    const { user, email_data } = data;
    const { token_hash, email_action_type, redirect_to } = email_data;
    
    console.log(`Processing ${email_action_type} email for ${user.email}`);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const resetLink = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
    
    // Create branded HTML email
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Gradient Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3AACB8 0%, #E8944A 100%); padding: 60px 40px; text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔐</div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                      Reset Your Password
                    </h1>
                    <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">
                      Secure access to your BattersBox account
                    </p>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    <p style="margin: 0 0 24px 0; color: #1e293b; font-size: 16px; line-height: 1.6;">
                      Hi there!
                    </p>
                    
                    <p style="margin: 0 0 32px 0; color: #475569; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password for your <strong style="color: #1e293b;">BattersBox</strong> account.
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 32px 0;">
                          <a href="${resetLink}" 
                             style="display: inline-block; background: linear-gradient(135deg, #3AACB8 0%, #8BBAC4 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(58, 172, 184, 0.3); transition: all 0.3s ease;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      This link expires in <strong>1 hour</strong> for your security.
                    </p>
                    
                    <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                      If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 32px 40px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 18px; font-weight: 700;">
                      BattersBox
                    </p>
                    <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
                      Empowering Insurance Agents
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © 2025 BattersBox. All rights reserved.
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
    
    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "BattersBox <noreply@battersbox.ai>",
      to: [user.email],
      subject: "Reset Your BattersBox Password",
      html,
    });
    
    console.log("Password reset email sent successfully:", emailResponse);
    
    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
