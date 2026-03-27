import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, User, Mail, Phone, Building2, Users, Lock, Award, XCircle, UserCheck } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import confetti from "canvas-confetti";

// Brand colors for confetti
const BRAND_TEAL = "#8BBAC4";
const BRAND_GOLD = "#C98A3A";

// Trigger haptic feedback on mobile devices
const triggerHapticFeedback = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([50, 30, 100, 30, 50]);
  }
};

// Play a subtle celebration sound
const playCelebrationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playTone(523.25, now, 0.15);
    playTone(659.25, now + 0.1, 0.2);
    playTone(783.99, now + 0.2, 0.25);
  } catch (error) {
    console.log("Audio not available:", error);
  }
};

const fireBrandConfetti = () => {
  triggerHapticFeedback();
  playCelebrationSound();
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: [BRAND_TEAL, BRAND_GOLD, "#FFFFFF"],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 0, y: 0.7 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.1, y: 0.7 } });
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 1, y: 0.7 } });
  fire(0.2, { spread: 60, origin: { x: 1, y: 0.7 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.9, y: 0.7 } });
};

type AgencyCodeRow = { id: string; code: string; label: string | null; display_order: number };
type AgencyManagerRow = { id: string; manager_name: string; display_order: number };

// Full schema for new users (includes password)
const fullFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  isLicensed: z.enum(["yes", "no"], { required_error: "Please select an option" }),
  agencyCode: z.string().min(1, "Please select an agency code"),
  assignedManager: z.string().min(1, "Please select your manager"),
  referredBy: z.string().min(2, "Please enter who referred you"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Reduced schema for existing users (no password)
const existingUserFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  isLicensed: z.enum(["yes", "no"], { required_error: "Please select an option" }),
  agencyCode: z.string().min(1, "Please select an agency code"),
  assignedManager: z.string().min(1, "Please select your manager"),
  referredBy: z.string().min(2, "Please enter who referred you"),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type FormValues = z.infer<typeof fullFormSchema>;

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const allSteps = [
  { id: 1, question: "Let's start with your name", icon: User, fields: ["firstName", "lastName"] as const },
  { id: 2, question: "Who referred you?", icon: Users, fields: ["referredBy"] as const },
  { id: 3, question: "Select your agency code", icon: Building2, fields: ["agencyCode"] as const },
  { id: 4, question: "Select your manager", icon: UserCheck, fields: ["assignedManager"] as const },
  { id: 5, question: "What's your email address?", icon: Mail, fields: ["email"] as const },
  { id: 6, question: "What's your phone number?", icon: Phone, fields: ["phone"] as const },
  { id: 7, question: "Are you licensed?", icon: Award, fields: ["isLicensed"] as const },
  { id: 8, question: "Create a secure password", icon: Lock, fields: ["password", "confirmPassword"] as const },
];

const passwordStepId = 8;

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [agencyCodes, setAgencyCodes] = useState<AgencyCodeRow[]>([]);
  const [agencyManagers, setAgencyManagers] = useState<AgencyManagerRow[]>([]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Fetch agency codes on mount
  useEffect(() => {
    const fetchCodes = async () => {
      const { data } = await supabase
        .from("agency_codes")
        .select("id, code, label, display_order")
        .eq("is_active", true)
        .order("display_order");
      if (data) setAgencyCodes(data);
    };
    if (open) fetchCodes();
  }, [open]);

  // Dynamically compute steps based on existing user status
  const steps = isExistingUser
    ? allSteps.filter((s) => s.id !== passwordStepId)
    : allSteps;

  const form = useForm<FormValues>({
    resolver: zodResolver(isExistingUser ? existingUserFormSchema : fullFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      isLicensed: undefined,
      agencyCode: "",
      assignedManager: "",
      referredBy: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch agency code to reset manager and fetch managers when it changes
  const selectedAgencyCode = form.watch("agencyCode");
  
  useEffect(() => {
    form.setValue("assignedManager", "");
    // Fetch managers for the selected agency code
    const fetchManagers = async () => {
      if (!selectedAgencyCode) { setAgencyManagers([]); return; }
      const selectedCodeRow = agencyCodes.find(ac => ac.code === selectedAgencyCode);
      if (!selectedCodeRow) { setAgencyManagers([]); return; }
      const { data } = await supabase
        .from("agency_managers")
        .select("id, manager_name, display_order")
        .eq("agency_code_id", selectedCodeRow.id)
        .eq("is_active", true)
        .order("display_order");
      if (data) setAgencyManagers(data);
    };
    fetchManagers();
  }, [selectedAgencyCode, form, agencyCodes]);

  // Find the current step config by matching the step index
  const currentStepIndex = currentStep - 1;
  const currentStepConfig = steps[currentStepIndex];
  const progress = (currentStep / steps.length) * 100;

  const validateCurrentStep = async () => {
    const fieldsToValidate = currentStepConfig.fields;
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        check_email: email,
      });
      if (error) {
        console.error("Error checking email:", error);
        return false;
      }
      return data === true;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    // Check email after the email step (step id 5)
    if (currentStepConfig.id === 5) {
      const email = form.getValues("email");
      const exists = await checkEmailExists(email);
      if (exists) {
        setIsExistingUser(true);
        // Clear password fields since they won't be needed
        form.setValue("password", "");
        form.setValue("confirmPassword", "");
      } else {
        setIsExistingUser(false);
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      if (isExistingUser) {
        // Existing user: skip signup, just send webhook
        const { error: webhookError } = await supabase.functions.invoke(
          "send-onboarding-webhook",
          {
            body: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              isLicensed: values.isLicensed === "yes",
              agencyCode: values.agencyCode,
              assignedManager: values.assignedManager,
              referredBy: values.referredBy,
            },
          }
        );

        if (webhookError) {
          console.error("Webhook error:", webhookError);
        }

        fireBrandConfetti();
        toast.success("Your information has been submitted!");
        onOpenChange(false);
      } else {
        // New user: full signup flow
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password!,
          options: {
            data: {
              full_name: `${values.firstName} ${values.lastName}`,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create account");

        const { error: dbError } = await supabase
          .from("onboarding_requests")
          .insert({
            user_id: authData.user.id,
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            is_licensed: values.isLicensed === "yes",
            agency_code: values.agencyCode || null,
            assigned_manager: values.assignedManager || null,
            referred_by: values.referredBy || null,
          });

        if (dbError) throw dbError;

        // Set signup_source to 'onboarding'
        await supabase
          .from("profiles")
          .update({ signup_source: "onboarding" })
          .eq("id", authData.user.id);

        const { error: webhookError } = await supabase.functions.invoke(
          "send-onboarding-webhook",
          {
            body: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
              isLicensed: values.isLicensed === "yes",
              agencyCode: values.agencyCode,
              assignedManager: values.assignedManager,
              referredBy: values.referredBy,
            },
          }
        );

        if (webhookError) {
          console.error("Webhook error:", webhookError);
        }

        fireBrandConfetti();
        setShowEmailConfirm(true);
      }
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !loading) {
        e.preventDefault();
        if (currentStep === steps.length) {
          form.handleSubmit(onSubmit)();
        } else {
          nextStep();
        }
      }
    };

    if (open) {
      window.addEventListener("keypress", handleKeyPress);
      return () => window.removeEventListener("keypress", handleKeyPress);
    }
  }, [open, currentStep, loading, steps.length, isExistingUser]);

  // Reset to step 1 when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setIsExistingUser(false);
      setShowEmailConfirm(false);
    }
  }, [open]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goToNext = async () => {
    setDirection(1);
    await nextStep();
  };

  const goToPrev = () => {
    setDirection(-1);
    prevStep();
  };

  if (!currentStepConfig) return null;

  const Icon = currentStepConfig.icon;
  const availableManagers = agencyManagers.map(m => m.manager_name);
  const isLastStep = currentStep === steps.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-full h-screen m-0 p-0 rounded-none border-0">
        {/* Email Confirmation Overlay */}
        <AnimatePresence>
          {showEmailConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-md w-full text-center space-y-6"
              >
                {/* Animated Mail Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(var(--brand-teal)/0.15), hsl(var(--brand-gold)/0.15))" }}
                >
                  <Mail className="w-10 h-10" style={{ color: "hsl(var(--brand-teal))" }} />
                </motion.div>

                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    You're almost there! 🎉
                  </h2>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    We just sent you an email with everything you need to finish getting contracted. 
                    Follow the instructions inside to complete your setup.
                  </p>
                </div>

                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    📬 Don't see it? Check your spam or junk folder
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sometimes emails land there by mistake. If you still can't find it, reach out and we'll get you sorted.
                  </p>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEmailConfirm(false);
                      onOpenChange(false);
                      navigate("/pending-approval");
                    }}
                    className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--brand-teal)) 0%, hsl(var(--brand-teal)/0.85) 100%)",
                      boxShadow: "0 10px 30px -5px hsl(var(--brand-teal) / 0.3)",
                      color: "black",
                    }}
                  >
                    Got it, thanks!
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-muted">
          <motion.div
            className="h-full bg-[hsl(var(--brand-teal))]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          />
        </div>

        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors z-50"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex items-center justify-center min-h-screen p-6">
          <div className="w-full max-w-2xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Step Indicator */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8">
                  <span style={{ color: "hsl(var(--brand-gold))" }} className="font-semibold">
                    Step {currentStep} of {steps.length}
                  </span>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStepConfig.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                    }}
                  >
                    {/* Question */}
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-full bg-[hsl(var(--brand-teal))]/10 flex items-center justify-center">
                        <Icon className="w-6 h-6" style={{ color: "hsl(var(--brand-teal))" }} />
                      </div>
                      <h2 className="text-3xl md:text-4xl font-bold">{currentStepConfig.question}</h2>
                    </div>

                    {/* Fields */}
                    <div className="space-y-6">
                      {/* Step 1: Name */}
                      {currentStepConfig.id === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name="firstName" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="First name" disabled={loading} className="h-14 text-lg" autoFocus />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="lastName" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="Last name" disabled={loading} className="h-14 text-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}

                      {/* Step 2: Who referred you? */}
                      {currentStepConfig.id === 2 && (
                        <FormField control={form.control} name="referredBy" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} placeholder="Name of person who referred you" disabled={loading} className="h-14 text-lg" autoFocus />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 3: Agency code */}
                      {currentStepConfig.id === 3 && (
                        <FormField control={form.control} name="agencyCode" render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                              <FormControl>
                                <SelectTrigger className="h-14 text-lg bg-background">
                                  <SelectValue placeholder="Choose your agency code" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background z-50">
                                {agencyCodes.map((ac) => (
                                  <SelectItem key={ac.code} value={ac.code} className="text-lg">
                                    {ac.code}{ac.label ? ` — ${ac.label}` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 4: Select manager */}
                      {currentStepConfig.id === 4 && (
                        <FormField control={form.control} name="assignedManager" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className={cn("grid gap-4", availableManagers.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2")}
                                disabled={loading}
                              >
                                {availableManagers.map((manager) => (
                                  <label
                                    key={manager}
                                    className={cn(
                                      "flex items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                      field.value === manager
                                        ? "border-[hsl(var(--brand-teal))] bg-[hsl(var(--brand-teal))]/10"
                                        : "border-border hover:border-muted-foreground"
                                    )}
                                  >
                                    <RadioGroupItem value={manager} className="sr-only" />
                                    <span className="text-xl font-semibold">{manager}</span>
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 5: Email */}
                      {currentStepConfig.id === 5 && (
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="email" placeholder="yourname@example.com" disabled={loading} className="h-14 text-lg" autoFocus />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 6: Phone */}
                      {currentStepConfig.id === 6 && (
                        <FormField control={form.control} name="phone" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input {...field} type="tel" placeholder="(555) 123-4567" disabled={loading} className="h-14 text-lg" autoFocus />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 7: Licensed? */}
                      {currentStepConfig.id === 7 && (
                        <FormField control={form.control} name="isLicensed" render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-2 gap-4" disabled={loading}>
                                <label className={cn(
                                  "flex flex-col items-center justify-center p-8 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                  field.value === "yes" ? "border-[hsl(var(--brand-teal))] bg-[hsl(var(--brand-teal))]/10" : "border-border hover:border-muted-foreground"
                                )}>
                                  <RadioGroupItem value="yes" className="sr-only" />
                                  <Award className="w-12 h-12 mb-3 text-green-500" />
                                  <span className="text-xl font-semibold">Yes</span>
                                </label>
                                <label className={cn(
                                  "flex flex-col items-center justify-center p-8 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                  field.value === "no" ? "border-[hsl(var(--brand-teal))] bg-[hsl(var(--brand-teal))]/10" : "border-border hover:border-muted-foreground"
                                )}>
                                  <RadioGroupItem value="no" className="sr-only" />
                                  <XCircle className="w-12 h-12 mb-3 text-red-400" />
                                  <span className="text-xl font-semibold">No</span>
                                </label>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {/* Step 8: Password (only for new users) */}
                      {currentStepConfig.id === 8 && (
                        <div className="space-y-4">
                          <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Enter password (min. 8 characters)" disabled={loading} className="h-14 text-lg" autoFocus />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} type="password" placeholder="Confirm password" disabled={loading} className="h-14 text-lg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation - Desktop Only */}
                {!isMobile && (
                  <>
                    <div className="flex items-center justify-between pt-8">
                      {currentStep > 1 ? (
                        <Button type="button" variant="ghost" onClick={goToPrev} disabled={loading} className="text-muted-foreground hover:text-foreground">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      ) : (
                        <div />
                      )}

                      {!isLastStep ? (
                        <Button type="button" onClick={goToNext} disabled={loading} className="h-12 px-8 text-lg" style={{ backgroundColor: "hsl(var(--brand-teal))", color: "white" }}>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button type="submit" disabled={loading} className="h-12 px-8 text-lg" style={{ backgroundColor: "hsl(var(--brand-teal))", color: "white" }}>
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Request"
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted rounded">Enter ↵</kbd> to continue
                      </p>
                    </div>
                  </>
                )}

                {isMobile && <div className="h-32" />}
              </form>
            </Form>
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50">
            {!isLastStep ? (
              <Button
                type="button"
                onClick={goToNext}
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: "linear-gradient(135deg, hsl(var(--brand-teal)) 0%, hsl(var(--brand-teal)/0.85) 100%)",
                  boxShadow: "0 10px 30px -5px hsl(var(--brand-teal) / 0.3)",
                  color: "black" 
                }}
              >
                Continue
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={loading}
                className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: "linear-gradient(135deg, hsl(var(--brand-teal)) 0%, hsl(var(--brand-teal)/0.85) 100%)",
                  boxShadow: "0 10px 30px -5px hsl(var(--brand-teal) / 0.3)",
                  color: "black" 
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            )}
            
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goToPrev}
                disabled={loading}
                className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to previous step
              </button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
