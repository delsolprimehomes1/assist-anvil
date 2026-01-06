import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CONSENT_TEXT = "I agree to receive text messages and communications from BattersBox.ai. Message and data rates may apply. Message frequency may vary. Reply STOP to opt-out or HELP for help at any time.";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Please enter a valid phone number: (XXX) XXX-XXXX"),
  smsConsent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to receive text messages to continue" }),
  }),
});

type FormData = z.infer<typeof formSchema>;

export const LeadCaptureForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      smsConsent: undefined,
    },
  });

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) {
      return digits.length > 0 ? `(${digits}` : "";
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("lead_captures").insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        sms_consent: data.smsConsent,
        consent_timestamp: new Date().toISOString(),
        consent_text: CONSENT_TEXT,
        user_agent: navigator.userAgent,
        source: "homepage",
      });

      if (error) throw error;

      setIsSuccess(true);
      toast({
        title: "Thank you!",
        description: "We'll be in touch soon.",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="py-20 bg-background">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="brand-card text-center py-12">
            <CardContent>
              <CheckCircle className="h-16 w-16 text-[hsl(var(--success))] mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-foreground mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                We've received your information and will be in touch soon.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Ready to Transform Your Business?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of insurance agents transforming their business
          </p>
        </div>

        <Card className="brand-card">
          <CardHeader>
            <CardTitle>Connect With BattersBox</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} className="h-12" />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} className="h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(555) 123-4567"
                          {...field}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            field.onChange(formatted);
                          }}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="smsConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4 bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                          {CONSENT_TEXT}
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <p className="text-xs text-muted-foreground">
                  By submitting this form, you agree to our{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms-of-service" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  .
                </p>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg bg-[hsl(var(--accent-gold))] hover:bg-[hsl(var(--accent-gold-dark))] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Get Started"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
