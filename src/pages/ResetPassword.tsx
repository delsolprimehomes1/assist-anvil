import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logo from "@/assets/batterbox-auth-logo.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isValidSession, setIsValidSession] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Recovery markers in the URL (implicit hash flow or PKCE ?code= flow)
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const hasRecoveryMarker =
      hash.includes("type=recovery") ||
      hash.includes("access_token") ||
      search.includes("code=");

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setIsValidSession(true);
          setChecking(false);
        }
      }
    );

    // Poll a few times while Supabase finishes exchanging the recovery token
    // from the URL — avoids the race where "Invalid Reset Link" showed even
    // after /verify succeeded.
    const start = Date.now();
    const maxWaitMs = hasRecoveryMarker ? 5000 : 1500;

    const tick = async () => {
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsValidSession(true);
        setChecking(false);
        return;
      }
      if (Date.now() - start >= maxWaitMs) {
        setChecking(false);
        return;
      }
      setTimeout(tick, 300);
    };
    tick();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password updated!",
        description: "Your password has been successfully updated.",
      });

      // Redirect to auth page
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <img src={logo} alt="BattersBox Logo" className="h-16 w-auto md:h-20" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">BattersBox Portal</h1>
          </div>
          
          <Card className="border-2 shadow-lg">
            <CardHeader>
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is invalid or has expired. Please request a new one.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/auth")} 
                className="w-full"
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2">
          <img src={logo} alt="BattersBox Logo" className="h-16 w-auto md:h-20" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">BattersBox Portal</h1>
          <p className="text-sm md:text-base text-muted-foreground text-center">
            Reset Your Password
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Set New Password</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-4 md:px-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          Remember your password?{" "}
          <button
            onClick={() => navigate("/auth")}
            className="text-primary hover:underline"
          >
            Back to Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
