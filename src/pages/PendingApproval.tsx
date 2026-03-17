import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export default function PendingApproval() {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkApprovalStatus();
    const interval = setInterval(checkApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, approval_status")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || "");
      if (profile.approval_status === "approved") {
        navigate("/");
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're almost there{userName ? `, ${userName}` : ""}! 🎉</CardTitle>
            <CardDescription className="text-base">
              Check your email to finish contracting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3"
            >
              <p className="text-sm text-foreground leading-relaxed">
                We just sent you an email with <span className="font-semibold">instructions to complete your contracting</span>. Follow the steps in that email and you'll be all set.
              </p>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-warning" />
                <p>
                  <span className="font-medium text-foreground">Don't see it?</span> Be sure to check your <span className="font-semibold">spam or junk folder</span> just in case — it sometimes lands there.
                </p>
              </div>
            </motion.div>

            <p className="text-sm text-muted-foreground text-center">
              Once your contracting is complete and your account is approved, this page will automatically update. Hang tight!
            </p>

            <div className="border-t pt-5 space-y-3">
              <p className="text-sm font-medium text-center">Need help?</p>
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>support@battersbox.com</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}