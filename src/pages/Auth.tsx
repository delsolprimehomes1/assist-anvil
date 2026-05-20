import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PartyPopper, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/batterbox-auth-logo.png";
import { OnboardingDialog } from "@/components/auth/OnboardingDialog";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
const Auth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdminResetFallback, setShowAdminResetFallback] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetFullName, setResetFullName] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [selfResetLoading, setSelfResetLoading] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [signupName, setSignupName] = useState("");

  const fireBrandConfetti = () => {
    const colors = ["#8BBAC4", "#C98A3A"];
    confetti({ particleCount: 80, spread: 70, origin: { x: 0, y: 0.6 }, colors });
    confetti({ particleCount: 80, spread: 70, origin: { x: 1, y: 0.6 }, colors });
  };
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !agencyName.trim() || !password.trim()) {
      toast({
        title: "All fields are required",
        description: "Please fill out every field before creating your account.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
            phone,
            agency_name: agencyName
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
        setSignupName(fullName);
        fireBrandConfetti();
        setShowSignupSuccess(true);
        
        // Notify admins in background
        try {
          await supabase.functions.invoke("notify-admin-signup", {
            body: { userName: fullName, userEmail: email, phone, agencyName },
          });
        } catch (e) {
          console.error("Failed to notify admins:", e);
        }
        
        setEmail("");
        setPassword("");
        setFullName("");
        setPhone("");
        setAgencyName("");
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
  const handleSelfServeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setSelfResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail.toLowerCase().trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "We sent a password reset link to your inbox. It may take a minute to arrive.",
      });
      setShowForgotPassword(false);
      setShowAdminResetFallback(false);
      setResetEmail("");
      setResetFullName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSelfResetLoading(false);
    }
  };
  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const { error } = await supabase
        .from("password_reset_requests")
        .insert({
          email: resetEmail.toLowerCase().trim(),
          full_name: resetFullName.trim(),
        });

      if (error) throw error;
      
      toast({
        title: "Request Submitted",
        description: "An administrator will reset your password shortly. Please check your email for the new password.",
      });
      setShowForgotPassword(false);
      setShowAdminResetFallback(false);
      setResetEmail("");
      setResetFullName("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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

        {/* Onboarding Section */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');
          @keyframes cardGlow {
            0%, 100% { box-shadow: 0 0 20px 8px rgba(139,186,196,0.35), 0 0 40px 16px rgba(139,186,196,0.15); }
            50% { box-shadow: 0 0 25px 10px rgba(201,138,58,0.35), 0 0 45px 20px rgba(201,138,58,0.15); }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
        <Card
          className="border-2 shadow-lg rounded-xl"
          style={{ animation: "cardGlow 3s ease-in-out infinite" }}
        >
          <CardContent className="pt-5 pb-5 px-4 md:px-6">
            <div className="text-center space-y-3">
              <p
                className="text-base md:text-lg font-medium"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#C98A3A",
                }}
              >
                Start your contracting process here 👇
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="relative w-full h-12 rounded-md text-base md:text-lg font-semibold text-white overflow-hidden"
                style={{
                  background: "linear-gradient(270deg, #8BBAC4, #C98A3A, #8BBAC4, #C98A3A)",
                  backgroundSize: "300% 300%",
                  animation: "gradientShift 4s ease infinite",
                }}
              >
                <span className="relative z-10">Request To Be Contracted</span>
                <div
                  className="absolute inset-0 z-[1]"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                    animation: "shimmer 2.5s ease-in-out infinite",
                  }}
                />
              </button>
            </div>
          </CardContent>
        </Card>

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
                    <Label htmlFor="signup-phone" className="text-sm">
                      Phone Number
                    </Label>
                    <Input id="signup-phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={e => setPhone(e.target.value)} required disabled={loading} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-agency" className="text-sm">
                      Agency Name
                    </Label>
                    <Input id="signup-agency" type="text" placeholder="Acme Insurance Agency" value={agencyName} onChange={e => setAgencyName(e.target.value)} required disabled={loading} className="h-11" />
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
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* Password Reset Request Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Password Reset</DialogTitle>
            <DialogDescription>
              Enter your information and an administrator will reset your password for you.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordResetRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-name">Full Name</Label>
              <Input 
                id="reset-name" 
                type="text" 
                placeholder="John Doe" 
                value={resetFullName} 
                onChange={e => setResetFullName(e.target.value)} 
                required 
                disabled={resetLoading} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input 
                id="reset-email" 
                type="email" 
                placeholder="you@example.com" 
                value={resetEmail} 
                onChange={e => setResetEmail(e.target.value)} 
                required 
                disabled={resetLoading} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail("");
                  setResetFullName("");
                }} 
                disabled={resetLoading} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading} className="flex-1">
                {resetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign-Up Success Modal */}
      <AnimatePresence>
        {showSignupSuccess && (
          <Dialog open={showSignupSuccess} onOpenChange={setShowSignupSuccess}>
            <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-card rounded-2xl p-8 shadow-2xl border text-center space-y-5"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #8BBAC4 0%, #C98A3A 100%)" }}
                >
                  <PartyPopper className="h-10 w-10 text-white" />
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    You're in{signupName ? `, ${signupName}` : ""}! 🎉
                  </h2>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Your sign-up is complete! The <span className="font-semibold text-foreground">BattersBox team</span> is reviewing your portal access — you'll be notified once you're approved.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" style={{ color: "#8BBAC4" }} />
                    <span>No action needed — we'll reach out when you're all set</span>
                  </div>
                </motion.div>

                <Button 
                  className="w-full h-11 text-base font-semibold"
                  style={{ background: "linear-gradient(135deg, #8BBAC4 0%, #6a9aa5 100%)" }}
                  onClick={() => {
                    setShowSignupSuccess(false);
                    navigate("/pending-approval");
                  }}
                >
                  Got it!
                </Button>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>;

};
export default Auth;