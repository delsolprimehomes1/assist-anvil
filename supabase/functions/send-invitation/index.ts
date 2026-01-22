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

    // Check if user is admin OR has a hierarchy_agents record (can invite to their own org)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const { data: hierarchyData } = await supabase
      .from("hierarchy_agents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = !!roleData;
    const hasHierarchy = !!hierarchyData;

    if (!isAdmin && !hasHierarchy) {
      throw new Error("Unauthorized: You must be an admin or have an organization to invite agents");
    }
    
    console.log(`User ${user.id} authorized - isAdmin: ${isAdmin}, hasHierarchy: ${hasHierarchy}`);

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

    // Mark any expired pending invitations as expired
    await supabase
      .from("user_invitations")
      .update({ status: "expired" })
      .eq("email", email)
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    // Check if there's already a pending (non-expired) invitation
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
      from: "BattersBox <invitations@battersbox.ai>",
      to: [email],
      subject: "You're invited to BattersBox 🎯",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                line-height: 1.6; 
                color: #1a1a1a; 
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
              }
              .container { 
                max-width: 600px; 
                margin: 40px auto; 
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              }
              .header { 
                background: linear-gradient(135deg, #3AACB8 0%, #E8944A 100%); 
                color: white; 
                padding: 50px 40px; 
                text-align: center; 
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: -0.5px;
              }
              .header p {
                margin: 12px 0 0 0;
                font-size: 16px;
                opacity: 0.95;
              }
              .content { 
                background: white; 
                padding: 40px; 
              }
              .greeting {
                font-size: 18px;
                color: #1a1a1a;
                margin: 0 0 24px 0;
                font-weight: 500;
              }
              .invitation-text {
                font-size: 16px;
                color: #4a4a4a;
                margin: 0 0 20px 0;
                line-height: 1.6;
              }
              .role-badge { 
                display: inline-block; 
                background: #3AACB8; 
                color: white;
                padding: 6px 16px; 
                border-radius: 20px; 
                font-size: 13px; 
                font-weight: 700; 
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 4px;
              }
              .note-card {
                background: linear-gradient(135deg, #f8feff 0%, #fff8f4 100%);
                padding: 20px;
                border-left: 4px solid #3AACB8;
                border-radius: 8px;
                margin: 24px 0;
              }
              .note-card em {
                font-size: 15px;
                color: #2a2a2a;
                font-style: italic;
                line-height: 1.6;
              }
              .platform-description {
                background: #fafafa;
                padding: 24px;
                border-radius: 8px;
                margin: 24px 0;
                border: 1px solid #e8e8e8;
              }
              .platform-description p {
                margin: 0;
                font-size: 15px;
                color: #4a4a4a;
                line-height: 1.7;
              }
              .platform-description strong {
                color: #3AACB8;
                font-weight: 600;
              }
              .cta-container {
                text-align: center;
                margin: 32px 0;
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #3AACB8 0%, #E8944A 100%); 
                color: white; 
                padding: 16px 48px; 
                text-decoration: none; 
                border-radius: 30px; 
                font-weight: 700; 
                font-size: 16px;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 15px rgba(58, 172, 184, 0.3);
                transition: transform 0.2s;
              }
              .expiry-notice {
                font-size: 13px;
                color: #888;
                text-align: center;
                margin: 24px 0 0 0;
                padding-top: 24px;
                border-top: 1px solid #e8e8e8;
              }
              .footer { 
                background: #fafafa;
                text-align: center; 
                padding: 30px 40px; 
                color: #666; 
                font-size: 13px; 
              }
              .footer-brand {
                font-weight: 700;
                color: #3AACB8;
                font-size: 16px;
                margin-bottom: 8px;
              }
              .footer-tagline {
                color: #888;
                font-style: italic;
                margin-bottom: 16px;
              }
              @media only screen and (max-width: 600px) {
                .container { margin: 0; border-radius: 0; }
                .header { padding: 40px 24px; }
                .content { padding: 32px 24px; }
                .header h1 { font-size: 28px; }
                .button { padding: 14px 36px; font-size: 15px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>You're Invited! 🎯</h1>
                <p>Join the ultimate resource platform for insurance agents</p>
              </div>
              <div class="content">
                <p class="greeting">Welcome!</p>
                <p class="invitation-text">
                  <strong>${inviterName}</strong> has invited you to join <strong>BattersBox</strong> as a <span class="role-badge">${role}</span>
                </p>
                ${notes ? `<div class="note-card"><em>"${notes}"</em></div>` : ''}
                <div class="platform-description">
                  <p>
                    <strong>BattersBox</strong> is your comprehensive resource platform for insurance agents, providing all the tools you need to <strong>scale and thrive</strong> in today's competitive market.
                  </p>
                </div>
                <div class="cta-container">
                  <a href="${invitationUrl}" class="button">Accept Invitation</a>
                </div>
                <p class="expiry-notice">
                  This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                <div class="footer-brand">BattersBox</div>
                <div class="footer-tagline">Empowering Insurance Agents</div>
                <p>© 2025 BattersBox. All rights reserved.</p>
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
