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

// Private mapping - never displayed to user
const AGENCY_MANAGER_MAP: Record<string, string[]> = {
  "100": ["K. Jenson", "E. Young Smith"],
  "200": ["C. Gutierrez"],
  "300": ["L. Gause"],
  "400": ["J. Meletia"],
  "500": ["A. Coleman"],
  "600": ["T. Hunt"]
};

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  {
    id: 1,
    question: "Let's start with your name",
    icon: User,
    fields: ["firstName", "lastName"] as const,
  },
  {
    id: 2,
    question: "What's your email address?",
    icon: Mail,
    fields: ["email"] as const,
  },
  {
    id: 3,
    question: "What's your phone number?",
    icon: Phone,
    fields: ["phone"] as const,
  },
  {
    id: 4,
    question: "Are you licensed?",
    icon: Award,
    fields: ["isLicensed"] as const,
  },
  {
    id: 5,
    question: "Select your agency code",
    icon: Building2,
    fields: ["agencyCode"] as const,
  },
  {
    id: 6,
    question: "Select your manager",
    icon: UserCheck,
    fields: ["assignedManager"] as const,
  },
  {
    id: 7,
    question: "Who referred you?",
    icon: Users,
    fields: ["referredBy"] as const,
  },
  {
    id: 8,
    question: "Create a secure password",
    icon: Lock,
    fields: ["password", "confirmPassword"] as const,
  },
];

export const OnboardingDialog = ({ open, onOpenChange }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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

  // Watch agency code to reset manager when it changes
  const selectedAgencyCode = form.watch("agencyCode");
  
  useEffect(() => {
    // Reset manager selection when agency code changes
    form.setValue("assignedManager", "");
  }, [selectedAgencyCode, form]);

  const currentStepConfig = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;

  const validateCurrentStep = async () => {
    const fieldsToValidate = currentStepConfig.fields;
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
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

      toast.success("Request submitted successfully!");
      onOpenChange(false);
      navigate("/pending-approval");
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
  }, [open, currentStep, loading]);

  // Reset to step 1 when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
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

  const Icon = currentStepConfig.icon;

  // Get available managers for the selected agency code
  const availableManagers = AGENCY_MANAGER_MAP[selectedAgencyCode] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-full h-screen m-0 p-0 rounded-none border-0">
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
                    key={currentStep}
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
                      {currentStep === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="First name"
                                    disabled={loading}
                                    className="h-14 text-lg"
                                    autoFocus
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Last name"
                                    disabled={loading}
                                    className="h-14 text-lg"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      {currentStep === 2 && (
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="yourname@example.com"
                                  disabled={loading}
                                  className="h-14 text-lg"
                                  autoFocus
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {currentStep === 3 && (
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="(555) 123-4567"
                                  disabled={loading}
                                  className="h-14 text-lg"
                                  autoFocus
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {currentStep === 4 && (
                        <FormField
                          control={form.control}
                          name="isLicensed"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="grid grid-cols-2 gap-4"
                                  disabled={loading}
                                >
                                  <label
                                    className={cn(
                                      "flex flex-col items-center justify-center p-8 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                      field.value === "yes"
                                        ? "border-[hsl(var(--brand-teal))] bg-[hsl(var(--brand-teal))]/10"
                                        : "border-border hover:border-muted-foreground"
                                    )}
                                  >
                                    <RadioGroupItem value="yes" className="sr-only" />
                                    <Award className="w-12 h-12 mb-3 text-green-500" />
                                    <span className="text-xl font-semibold">Yes</span>
                                  </label>
                                  <label
                                    className={cn(
                                      "flex flex-col items-center justify-center p-8 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                      field.value === "no"
                                        ? "border-[hsl(var(--brand-teal))] bg-[hsl(var(--brand-teal))]/10"
                                        : "border-border hover:border-muted-foreground"
                                    )}
                                  >
                                    <RadioGroupItem value="no" className="sr-only" />
                                    <XCircle className="w-12 h-12 mb-3 text-red-400" />
                                    <span className="text-xl font-semibold">No</span>
                                  </label>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {currentStep === 5 && (
                        <FormField
                          control={form.control}
                          name="agencyCode"
                          render={({ field }) => (
                            <FormItem>
                              <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                                <FormControl>
                                  <SelectTrigger className="h-14 text-lg bg-background">
                                    <SelectValue placeholder="Choose your agency code" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-background z-50">
                                  {["100", "200", "300", "400", "500", "600"].map((code) => (
                                    <SelectItem key={code} value={code} className="text-lg">
                                      {code}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {currentStep === 6 && (
                        <FormField
                          control={form.control}
                          name="assignedManager"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className={cn(
                                    "grid gap-4",
                                    availableManagers.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
                                  )}
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
                          )}
                        />
                      )}

                      {currentStep === 7 && (
                        <FormField
                          control={form.control}
                          name="referredBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Name of person who referred you"
                                  disabled={loading}
                                  className="h-14 text-lg"
                                  autoFocus
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {currentStep === 8 && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Enter password (min. 8 characters)"
                                    disabled={loading}
                                    className="h-14 text-lg"
                                    autoFocus
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Confirm password"
                                    disabled={loading}
                                    className="h-14 text-lg"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
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
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={goToPrev}
                          disabled={loading}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                      ) : (
                        <div />
                      )}

                      {currentStep < steps.length ? (
                        <Button
                          type="button"
                          onClick={goToNext}
                          disabled={loading}
                          className="h-12 px-8 text-lg"
                          style={{ backgroundColor: "hsl(var(--brand-teal))", color: "white" }}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="h-12 px-8 text-lg"
                          style={{ backgroundColor: "hsl(var(--brand-teal))", color: "white" }}
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
                    </div>

                    {/* Keyboard Hint - Desktop only */}
                    <div className="text-center pt-4">
                      <p className="text-sm text-muted-foreground">
                        Press <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted rounded">Enter ↵</kbd> to continue
                      </p>
                    </div>
                  </>
                )}

                {/* Mobile: Add bottom padding to prevent overlap with fixed footer */}
                {isMobile && <div className="h-32" />}
              </form>
            </Form>
          </div>
        </div>

        {/* Mobile Fixed Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50">
            {currentStep < steps.length ? (
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
