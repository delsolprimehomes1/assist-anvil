import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from("user_invitations")
          .select(`
            *,
            profiles:invited_by(full_name, email)
          `)
          .eq("invitation_token", token)
          .single();

        if (error) throw error;

        if (!data) {
          setError("Invitation not found");
          return;
        }

        if (data.status !== "pending") {
          setError("This invitation has already been used or cancelled");
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          setError("This invitation has expired");
          return;
        }

        setInvitation(data);
      } catch (error: any) {
        console.error("Error fetching invitation:", error);
        setError("Invalid invitation link");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: "Full name required",
        description: "Please enter your full name",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from("user_invitations")
        .update({ status: "accepted" })
        .eq("invitation_token", token);

      if (updateError) {
        console.error("Error updating invitation:", updateError);
      }

      // Place new user under their inviter in the hierarchy
      if (invitation.invited_by) {
        const { data: inviterHierarchy } = await supabase
          .from("hierarchy_agents")
          .select("id, path, depth")
          .eq("user_id", invitation.invited_by)
          .single();

        if (inviterHierarchy) {
          const newPath = `${inviterHierarchy.path}.${authData.user.id.replace(/-/g, '_')}`;
          const newDepth = (inviterHierarchy.depth || 0) + 1;

          // Update the auto-created hierarchy record to be under the inviter
          const { error: hierarchyError } = await supabase
            .from("hierarchy_agents")
            .update({
              parent_id: inviterHierarchy.id,
              path: newPath,
              depth: newDepth,
            })
            .eq("user_id", authData.user.id);

          if (hierarchyError) {
            console.error("Error updating hierarchy placement:", hierarchyError);
          }
        }
      }

      toast({
        title: "Account created successfully!",
        description: "You can now log in with your credentials",
      });

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Failed to create account",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-center">Accept Invitation</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join LifeCo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{invitation.email}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Role:</span>
              <Badge variant="outline">{invitation.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Invited by:</span>
              <span className="text-sm">
                {invitation.profiles?.full_name || invitation.profiles?.email || "Admin"}
              </span>
            </div>
            {invitation.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm italic text-muted-foreground">"{invitation.notes}"</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
