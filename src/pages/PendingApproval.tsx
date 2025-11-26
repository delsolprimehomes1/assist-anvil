import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, Phone } from "lucide-react";

export default function PendingApproval() {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkApprovalStatus();

    // Check approval status every 30 seconds
    const interval = setInterval(checkApprovalStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkApprovalStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Get profile data
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, approval_status")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || "");
      
      // If approved, redirect to dashboard
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
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-brand-teal/10 flex items-center justify-center">
            <Clock className="h-8 w-8" style={{ color: "hsl(var(--brand-teal))" }} />
          </div>
          <CardTitle className="text-2xl">Welcome{userName ? `, ${userName}` : ""}!</CardTitle>
          <CardDescription className="text-base">
            Your application is being reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Thank you for your interest in joining BattersBox. Our admin team is reviewing your application and will approve your access shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              You'll receive an email notification once your account is approved. This page will automatically refresh when you're ready to go.
            </p>
          </div>

          <div className="border-t pt-6 space-y-3">
            <p className="text-sm font-medium text-center">Need immediate assistance?</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center">
                <Mail className="h-4 w-4" />
                <span>support@battersbox.com</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Phone className="h-4 w-4" />
                <span>1-800-BATTERS</span>
              </div>
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
    </div>
  );
}
