import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInvitationRequest {
  token: string;
  fullName?: string;
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client for bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request
    const { token, fullName, password }: AcceptInvitationRequest = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invitation token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing invitation acceptance for token: ${token.substring(0, 8)}...`);

    // 1. Fetch the invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("user_invitations")
      .select("*")
      .eq("invitation_token", token)
      .single();

    if (invitationError || !invitation) {
      console.error("Invitation fetch error:", invitationError);
      return new Response(
        JSON.stringify({ error: "Invalid invitation token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate invitation status
    if (invitation.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "This invitation has already been used" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: "This invitation has expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Invitation valid. Invited by: ${invitation.invited_by}, Email: ${invitation.email}`);

    // 3. Check if user is authenticated (existing user flow)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabaseAuth = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabaseAuth.auth.getUser();
      if (user) {
        userId = user.id;
        console.log(`Authenticated user accepting invite: ${userId}`);
        
        // Verify email matches
        if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
          return new Response(
            JSON.stringify({ 
              error: "Email mismatch", 
              message: `This invitation was sent to ${invitation.email}. Please log in with that email address.` 
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 4. If no authenticated user, create new account
    if (!userId) {
      if (!fullName || !password) {
        return new Response(
          JSON.stringify({ error: "Full name and password are required for new accounts" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Creating new user account for: ${invitation.email}`);
      
      const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

      if (signUpError) {
        console.error("Signup error:", signUpError);
        return new Response(
          JSON.stringify({ error: signUpError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = authData.user!.id;
      console.log(`New user created with ID: ${userId}`);
    }

    // 5. Get inviter's hierarchy info
    const { data: inviterHierarchy, error: inviterError } = await supabaseAdmin
      .from("hierarchy_agents")
      .select("id, path, depth")
      .eq("user_id", invitation.invited_by)
      .single();

    if (inviterError) {
      console.error("Error fetching inviter hierarchy:", inviterError);
      // Continue anyway - they'll be placed as root if inviter not found
    }

    // 6. Check if hierarchy record exists for acceptor
    const { data: existingHierarchy } = await supabaseAdmin
      .from("hierarchy_agents")
      .select("id, path, depth, parent_id")
      .eq("user_id", userId)
      .single();

    // 7. Calculate correct placement
    const sanitizedUserId = userId.replace(/-/g, "_");
    let newPath: string;
    let newDepth: number;
    let newParentId: string | null = null;

    if (inviterHierarchy) {
      newPath = `${inviterHierarchy.path}.${sanitizedUserId}`;
      newDepth = (inviterHierarchy.depth || 0) + 1;
      newParentId = inviterHierarchy.id;
      console.log(`Placing under inviter. Path: ${newPath}, Depth: ${newDepth}`);
    } else {
      // Fallback: place as root if inviter not found
      newPath = sanitizedUserId;
      newDepth = 0;
      console.log(`Inviter hierarchy not found, placing as root. Path: ${newPath}`);
    }

    // 8. Update or insert hierarchy record
    if (existingHierarchy) {
      console.log(`Updating existing hierarchy record: ${existingHierarchy.id}`);
      const { error: updateHierarchyError } = await supabaseAdmin
        .from("hierarchy_agents")
        .update({
          parent_id: newParentId,
          path: newPath,
          depth: newDepth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingHierarchy.id);

      if (updateHierarchyError) {
        console.error("Error updating hierarchy:", updateHierarchyError);
        return new Response(
          JSON.stringify({ error: "Failed to update hierarchy placement" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      console.log(`Creating new hierarchy record for user: ${userId}`);
      const { error: insertHierarchyError } = await supabaseAdmin
        .from("hierarchy_agents")
        .insert({
          user_id: userId,
          parent_id: newParentId,
          path: newPath,
          depth: newDepth,
          status: "active",
          tier: "new_agent",
          verification_complete: false,
          joined_at: new Date().toISOString(),
        });

      if (insertHierarchyError) {
        console.error("Error inserting hierarchy:", insertHierarchyError);
        // Don't fail the whole operation - the trigger might have created it
      }
    }

    // 9. Update invitation status
    const { error: updateInvitationError } = await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateInvitationError) {
      console.error("Error updating invitation status:", updateInvitationError);
      // Non-fatal - continue
    }

    console.log(`Invitation acceptance complete. User ${userId} placed under inviter.`);

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        invitationId: invitation.id,
        email: invitation.email,
        placedUnder: invitation.invited_by,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
