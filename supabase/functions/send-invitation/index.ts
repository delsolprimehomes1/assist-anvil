import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "admin" | "agent";
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      throw new Error("Unauthorized: Admin access required");
    }

    const { email, role, notes }: InvitationRequest = await req.json();

    // Validate email
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email address");
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from("user_invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      throw new Error("An invitation for this email is already pending");
    }

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("user_invitations")
      .insert({
        email,
        role,
        notes,
        invited_by: user.id,
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      throw new Error("Failed to create invitation");
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "Admin";
    const invitationUrl = `${req.headers.get("origin")}/accept-invitation?token=${invitation.invitation_token}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "LifeCo <onboarding@resend.dev>",
      to: [email],
      subject: "You've been invited to join LifeCo",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
              .button { display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
              .button:hover { background: #5568d3; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
              .role-badge { display: inline-block; background: #f0f0f0; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #667eea; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">You're Invited! 🎉</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-top: 0;">Hi there!</p>
                <p><strong>${inviterName}</strong> has invited you to join the LifeCo platform as a <span class="role-badge">${role.toUpperCase()}</span></p>
                ${notes ? `<p style="background: #f9f9f9; padding: 15px; border-left: 3px solid #667eea; margin: 20px 0;"><em>"${notes}"</em></p>` : ''}
                <p>LifeCo is your comprehensive platform for life insurance carriers, products, and agent tools.</p>
                <div style="text-align: center;">
                  <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <p>© 2024 LifeCo. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Invitation sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        invitation_id: invitation.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send invitation" }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
