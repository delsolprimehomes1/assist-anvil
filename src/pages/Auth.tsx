import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/batterbox-auth-logo.png";
import { OnboardingDialog } from "@/components/auth/OnboardingDialog";
const Auth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName
          }
        }
      });
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success!",
          description: "Your account has been created. Please log in."
        });
        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We sent you a password reset link."
      });
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
      <div className="w-full max-w-md space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center space-y-2">
          <img src={logo} alt="BattersBox Logo" className="h-16 w-auto md:h-20" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">BattersBox Portal</h1>
          <p className="text-sm md:text-base text-muted-foreground text-center">
            Insurance Agent Resources & Tools
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-2 shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="space-y-4 pb-4">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="login" className="text-sm md:text-base">
                  Login
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm md:text-base">
                  Sign Up
                </TabsTrigger>
              </TabsList>
              <div>
                <CardTitle className="text-xl md:text-2xl">Welcome</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Sign in to access your agent dashboard
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-4 md:px-6">
              {/* Login Form */}
              <TabsContent value="login" className="space-y-4 mt-0">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm">
                      Email Address
                    </Label>
                    <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="h-11" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-sm">
                      Password
                    </Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className="h-11" />
                  </div>

                  <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
                    {loading ? <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </> : "Sign In"}
                  </Button>

                  <Button type="button" variant="link" className="w-full text-sm" disabled={loading} onClick={() => setShowForgotPassword(true)}>
                    Forgot password?
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-4 mt-0">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm">
                      Full Name
                    </Label>
                    <Input id="signup-name" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required disabled={loading} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm">
                      Email Address
                    </Label>
                    <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm">
                      Password
                    </Label>
                    <Input id="signup-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={loading} className="h-11" />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters
                    </p>
                  </div>

                  <Button type="submit" className="w-full h-11" size="lg" disabled={loading}>
                    {loading ? <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating account...
                      </> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Onboarding Section */}
        <Card className="border-2 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">Not onboarded yet as an agency?</p>
              <Button variant="outline" className="w-full h-11" onClick={() => setShowOnboarding(true)} style={{
              borderColor: "hsl(var(--brand-teal))",
              color: "hsl(var(--brand-teal))"
            }}>Request To Be Contracted</Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a password reset link.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input id="reset-email" type="email" placeholder="you@example.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required disabled={resetLoading} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)} disabled={resetLoading} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading} className="flex-1">
                {resetLoading ? <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </> : "Send Reset Link"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Auth;