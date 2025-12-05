import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Globe, 
  Target, 
  Bot, 
  Filter, 
  Zap, 
  LayoutDashboard, 
  Code, 
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const services = [
  { id: "website", label: "Custom Website", icon: Globe, description: "Professional, conversion-focused websites" },
  { id: "ads", label: "Ad Strategy for Recruiting", icon: Target, description: "Targeted campaigns to grow your team" },
  { id: "chatbots", label: "Custom Chatbots", icon: Bot, description: "AI-powered lead qualification" },
  { id: "funnels", label: "Sales Funnels", icon: Filter, description: "High-converting lead capture systems" },
  { id: "automations", label: "Automations", icon: Zap, description: "Streamline your workflows" },
  { id: "dashboards", label: "Agency Dashboards", icon: LayoutDashboard, description: "Custom reporting & analytics" },
  { id: "api", label: "API Configurations", icon: Code, description: "Connect your tools seamlessly" },
  { id: "other", label: "Other", icon: Plus, description: "Something else in mind?" },
];

const timelines = [
  { value: "asap", label: "ASAP" },
  { value: "1-2-weeks", label: "1-2 Weeks" },
  { value: "1-month", label: "1 Month" },
  { value: "flexible", label: "Flexible" },
];

const budgets = [
  { value: "under-500", label: "Under $500" },
  { value: "500-2k", label: "$500 - $2,000" },
  { value: "2k-5k", label: "$2,000 - $5,000" },
  { value: "5k-plus", label: "$5,000+" },
  { value: "not-sure", label: "Not Sure Yet" },
];

export const CustomBuildsForm = () => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    selectedServices: [] as string[],
    otherService: "",
    description: "",
    timeline: "",
    budget: "",
  });

  const totalSteps = 5;

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.fullName.trim() && formData.email.trim();
      case 2: return formData.selectedServices.length > 0;
      case 3: return formData.description.trim() && formData.timeline && formData.budget;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call - can be connected to webhook later
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsComplete(true);
    
    toast({
      title: "Request Submitted!",
      description: "Our marketing team will reach out within 24 hours.",
    });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-teal to-brand-teal/70 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-teal/30">
              <Rocket className="w-10 h-10 text-black" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Let's Build Something Amazing
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Connect with our Marketing Consultants to discuss custom solutions tailored for your agency.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-4">
              {["Websites", "Funnels", "Chatbots", "Automations"].map((item) => (
                <span 
                  key={item} 
                  className="px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Tell us about yourself
              </h2>
              <p className="text-muted-foreground">
                So we can reach out to schedule your consultation
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="John Smith"
                  className="h-12 text-base"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="john@example.com"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                What are you interested in?
              </h2>
              <p className="text-muted-foreground">
                Select all that apply
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {services.map((service) => {
                const Icon = service.icon;
                const isSelected = formData.selectedServices.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200",
                      isSelected 
                        ? "border-brand-teal bg-brand-teal/10 shadow-md" 
                        : "border-border hover:border-brand-teal/50 hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-brand-teal text-black" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium transition-colors",
                        isSelected ? "text-brand-teal" : "text-foreground"
                      )}>
                        {service.label}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-brand-teal shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {formData.selectedServices.includes("other") && (
              <div className="max-w-md mx-auto">
                <Input
                  value={formData.otherService}
                  onChange={(e) => updateField("otherService", e.target.value)}
                  placeholder="Tell us what you have in mind..."
                  className="h-12 text-base"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Project Details
              </h2>
              <p className="text-muted-foreground">
                Help us understand your vision
              </p>
            </div>
            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label htmlFor="description">What would you like to accomplish? *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe your goals, challenges, or ideas..."
                  className="min-h-[120px] text-base resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timeline *</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => updateField("timeline", value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {timelines.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget Range *</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => updateField("budget", value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {budgets.map((b) => (
                        <SelectItem key={b.value} value={b.value}>
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Review Your Request
              </h2>
              <p className="text-muted-foreground">
                Make sure everything looks good
              </p>
            </div>
            <div className="max-w-md mx-auto space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{formData.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                )}
              </div>
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm">Services</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.selectedServices.map((id) => {
                      const service = services.find(s => s.id === id);
                      return (
                        <span 
                          key={id}
                          className="px-2 py-1 bg-brand-teal/20 text-brand-teal text-sm rounded-md"
                        >
                          {service?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeline</span>
                  <span className="font-medium">
                    {timelines.find(t => t.value === formData.timeline)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium">
                    {budgets.find(b => b.value === formData.budget)?.label}
                  </span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <span className="text-muted-foreground text-sm">Project Description</span>
                <p className="mt-1 text-sm">{formData.description}</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isComplete) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-border/50 p-8 md:p-12 max-w-lg mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-gold to-brand-gold/70 rounded-full flex items-center justify-center mb-6"
          >
            <Sparkles className="w-10 h-10 text-black" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            You're All Set!
          </h2>
          <p className="text-muted-foreground mb-6">
            Our marketing team will reach out within 24 hours to schedule your consultation.
          </p>
          <Button 
            onClick={() => {
              setIsComplete(false);
              setStep(0);
              setFormData({
                fullName: "",
                email: "",
                phone: "",
                selectedServices: [],
                otherService: "",
                description: "",
                timeline: "",
                budget: "",
              });
            }}
            variant="outline"
          >
            Submit Another Request
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[500px] py-8">
      <div className="w-full max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {step + 1} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((step + 1) / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-teal to-brand-teal/70"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-background/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 border border-border/50 transform hover:translate-y-[-2px] transition-all duration-300 overflow-hidden">
          <div className="p-6 md:p-10">
            <AnimatePresence mode="wait" custom={1}>
              <motion.div
                key={step}
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="px-6 md:px-10 pb-6 md:pb-10 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className={cn(step === 0 && "invisible")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {step < totalSteps - 1 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="bg-gradient-to-r from-brand-teal to-brand-teal/80 text-black hover:from-brand-teal/90 hover:to-brand-teal/70 shadow-lg shadow-brand-teal/30 px-8"
                >
                  {step === 0 ? "Get Started" : "Continue"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-brand-gold to-brand-gold/80 text-black hover:from-brand-gold/90 hover:to-brand-gold/70 shadow-lg shadow-brand-gold/30 px-8"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse">Submitting...</span>
                    </>
                  ) : (
                    <>
                      Schedule Consultation
                      <Rocket className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
