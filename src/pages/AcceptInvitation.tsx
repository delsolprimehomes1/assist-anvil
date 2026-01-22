import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const { data, error } = await supabase
          .from("user_invitations")
          .select("*")
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

        // If user is logged in, check email match
        if (user && user.email?.toLowerCase() !== data.email.toLowerCase()) {
          setError(`This invitation was sent to ${data.email}. Please log out and use that email address, or log in with the correct account.`);
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
  }, [token, user, authLoading]);

  const callAcceptInvitation = async (payload: { token: string; fullName?: string; password?: string }) => {
    const response = await supabase.functions.invoke("accept-invitation", {
      body: payload,
    });

    if (response.error) {
      throw new Error(response.error.message || "Failed to accept invitation");
    }

    if (response.data?.error) {
      throw new Error(response.data.error);
    }

    return response.data;
  };

  // Handle existing user joining organization
  const handleJoinOrganization = async () => {
    if (!user) return;

    setSubmitting(true);

    try {
      await callAcceptInvitation({ token: token! });

      toast({
        title: "Successfully joined organization!",
        description: "You have been placed under your inviter in the hierarchy.",
      });

      setTimeout(() => {
        navigate("/dashboard/organization");
      }, 1500);
    } catch (error: any) {
      console.error("Error joining organization:", error);
      toast({
        title: "Failed to join organization",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle new user signup
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
      const result = await callAcceptInvitation({
        token: token!,
        fullName,
        password,
      });

      toast({
        title: "Account created successfully!",
        description: "You can now log in with your credentials.",
      });

      // Sign in the user automatically
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError) {
        console.error("Auto sign-in failed:", signInError);
        // Still redirect to auth page
        setTimeout(() => {
          navigate("/auth");
        }, 2000);
      } else {
        // Redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
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

  if (loading || authLoading) {
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
          <CardContent className="space-y-3">
            {user && (
              <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
                Sign Out
              </Button>
            )}
            <Button className="w-full" onClick={() => navigate("/auth")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged-in user flow: Join Organization
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-center">Join Organization</CardTitle>
            <CardDescription className="text-center">
              You've been invited to join the team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline" className="capitalize">{invitation.role}</Badge>
              </div>
              {invitation.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm italic text-muted-foreground">"{invitation.notes}"</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-6 text-center">
              Clicking below will add you to the organization under your inviter's team.
            </p>

            <Button 
              onClick={handleJoinOrganization} 
              className="w-full" 
              disabled={submitting}
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join Organization
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // New user flow: Create Account
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
              <Badge variant="outline" className="capitalize">{invitation.role}</Badge>
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

          <p className="text-xs text-muted-foreground text-center mt-4">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-xs" onClick={() => navigate("/auth")}>
              Log in first
            </Button>
            , then click your invite link again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
