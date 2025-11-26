import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAccess = async () => {
      if (!loading && !user) {
        navigate("/auth");
        return;
      }

      if (user) {
        // Check approval status
        const { data: profile } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", user.id)
          .single();

        if (profile?.approval_status === "pending") {
          navigate("/pending-approval");
        } else if (profile?.approval_status === "rejected") {
          toast.error("Your account application was not approved. Please contact support.");
          await supabase.auth.signOut();
          navigate("/auth");
        }
      }
    };

    checkUserAccess();
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
