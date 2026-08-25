import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, ArrowRight, ClipboardCheck, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/batterbox-auth-logo.png";
import { OnboardingDialog } from "@/components/auth/OnboardingDialog";
import { motion } from "framer-motion";
const Auth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdminResetFallback, setShowAdminResetFallback] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetFullName, setResetFullName] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [selfResetLoading, setSelfResetLoading] = useState(false);
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
      const { error } = await supabase.functions.invoke("send-password-reset-email", {
        body: {
          email: resetEmail.toLowerCase().trim(),
          redirectOrigin: window.location.origin,
        },
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description: "If an account exists for that email, we've sent a password reset link. It may take a minute to arrive.",
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
  const steps = [
    { icon: ClipboardCheck, label: "Request contracting", sub: "Quick guided application" },
    { icon: ShieldCheck, label: "We review & approve", sub: "The BattersBox team verifies you" },
    { icon: LayoutDashboard, label: "Access your portal", sub: "Carriers, tools, training & AI" },
  ];
  return <div className="min-h-screen flex flex-col lg:flex-row">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 8px 30px -6px rgba(201,138,58,0.55), 0 0 0 0 rgba(139,186,196,0.0); }
          50% { box-shadow: 0 8px 40px -4px rgba(139,186,196,0.6), 0 0 30px 4px rgba(201,138,58,0.25); }
        }
        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -20px) scale(1.08); }
        }
      `}</style>

      {/* ───────────── LEFT — NEW AGENTS (dominant) ───────────── */}
      <div
        className="relative flex-1 lg:w-[58%] flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0A1B21 0%, #0E242D 55%, #122E33 100%)" }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #8BBAC4 0%, transparent 65%)", animation: "floatGlow 9s ease-in-out infinite" }}
        />
        <div
          className="pointer-events-none absolute -bottom-48 -right-32 h-[520px] w-[520px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #C98A3A 0%, transparent 65%)", animation: "floatGlow 11s ease-in-out infinite reverse" }}
        />
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        {/* Brand row */}
        <div className="relative z-10 flex items-center gap-3 px-6 pt-6 md:px-12 lg:px-16">
          <div className="rounded-xl bg-white/95 p-1.5 shadow-lg">
            <img src={logo} alt="BattersBox Logo" className="h-9 w-auto" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-white">BattersBox Portal</p>
            <p className="text-[11px] text-white/50">Insurance Agent Resources & Tools</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-12 md:px-12 lg:px-16 xl:pr-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-xl space-y-7"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C98A3A]/40 bg-[#C98A3A]/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C98A3A] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C98A3A]" />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#E3B378]">
                New agents start here
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl leading-[1.08] text-white md:text-5xl xl:text-6xl"
              style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}
            >
              Step up to
              <br />
              the plate<span style={{ color: "#C98A3A" }}>.</span>
            </h1>

            <p className="text-base leading-relaxed text-white/70 md:text-lg">
              First time here? Requesting to be contracted is your{" "}
              <span className="font-semibold text-white">required first step</span> — your
              portal account is created automatically during the process. No separate sign-up needed.
            </p>

            {/* Dominant CTA */}
            <button
              onClick={() => setShowOnboarding(true)}
              className="group relative w-full overflow-hidden rounded-2xl px-8 py-5 text-lg font-bold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] md:text-xl"
              style={{
                background: "linear-gradient(270deg, #8BBAC4, #C98A3A, #8BBAC4, #C98A3A)",
                backgroundSize: "300% 300%",
                animation: "gradientShift 4s ease infinite, ctaPulse 3s ease-in-out infinite",
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                Request To Be Contracted
                <ArrowRight className="h-6 w-6 transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
              <div
                className="absolute inset-0 z-[1]"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
                  animation: "shimmer 2.5s ease-in-out infinite",
                }}
              />
            </button>

            {/* Steps */}
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.12 }}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <step.icon className="h-4 w-4 shrink-0" style={{ color: "#8BBAC4" }} />
                    <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                      Step {i + 1}
                    </p>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-white">{step.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-white/50">{step.sub}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ───────────── RIGHT — SIGN IN ───────────── */}
      <div className="relative flex items-center justify-center bg-background px-6 py-14 lg:w-[42%] lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <LogIn className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-[0.18em]">Returning agents</p>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Are you already contracted?
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Yes?</span> Sign in below to access
              your agent dashboard.{" "}
              <span className="font-semibold text-foreground">Not yet?</span> Start with{" "}
              <button
                type="button"
                className="font-semibold underline underline-offset-2"
                style={{ color: "#C98A3A" }}
                onClick={() => setShowOnboarding(true)}
              >
                Request To Be Contracted
              </button>
              .
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="h-12 rounded-xl" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
              <Input id="login-password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className="h-12 rounded-xl" />
            </div>

            <Button type="submit" className="h-12 w-full rounded-xl text-base font-semibold" size="lg" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </> : "Sign In"}
            </Button>
          </form>

          {/* Redirect for lost new users */}
          <div className="rounded-xl border border-dashed p-4 text-center" style={{ borderColor: "#C98A3A66", background: "#C98A3A0D" }}>
            <p className="text-sm text-muted-foreground">
              New to BattersBox and not contracted yet?
            </p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-2 hover:underline"
              style={{ color: "#C98A3A" }}
              onClick={() => setShowOnboarding(true)}
            >
              Request to be contracted first
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>

      <OnboardingDialog open={showOnboarding} onOpenChange={setShowOnboarding} />

      {/* Password Reset Dialog (Hybrid: self-serve primary, admin fallback) */}
      <Dialog open={showForgotPassword} onOpenChange={(open) => {
        setShowForgotPassword(open);
        if (!open) {
          setShowAdminResetFallback(false);
          setResetEmail("");
          setResetFullName("");
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showAdminResetFallback ? "Request Admin Reset" : "Reset Your Password"}
            </DialogTitle>
            <DialogDescription>
              {showAdminResetFallback
                ? "An administrator will reset your password manually and email you the new one."
                : "Enter your email and we'll send you a secure link to set a new password."}
            </DialogDescription>
          </DialogHeader>

          {!showAdminResetFallback ? (
            <form onSubmit={handleSelfServeReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  disabled={selfResetLoading}
                />
              </div>
              <Button type="submit" disabled={selfResetLoading} className="w-full">
                {selfResetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <div className="text-center pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Can't access your email?</p>
                <Button
                  type="button"
                  variant="link"
                  className="text-xs h-auto p-0"
                  onClick={() => setShowAdminResetFallback(true)}
                >
                  Request an admin reset instead
                </Button>
              </div>
            </form>
          ) : (
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
                <Label htmlFor="reset-email-admin">Email Address</Label>
                <Input
                  id="reset-email-admin"
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
                  onClick={() => setShowAdminResetFallback(false)}
                  disabled={resetLoading}
                  className="flex-1"
                >
                  Back
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
          )}
        </DialogContent>
      </Dialog>
    </div>;

};
export default Auth;
