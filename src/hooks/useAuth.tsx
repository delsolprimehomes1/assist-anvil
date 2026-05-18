import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Module-scoped guard so all useAuth consumers share one "already pinged" flag.
let hasPingedThisLoad = false;
const pingLastLoginOnce = () => {
  if (hasPingedThisLoad) return;
  hasPingedThisLoad = true;
  setTimeout(() => {
    supabase.rpc("update_my_last_login" as any).then(({ error }) => {
      if (error) console.warn("update_my_last_login failed:", error.message);
    });
  }, 0);
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Only stamp on a real new sign-in, not TOKEN_REFRESHED echoes.
        if (event === "SIGNED_IN") {
          pingLastLoginOnce();
        }
        if (event === "SIGNED_OUT") {
          hasPingedThisLoad = false;
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) pingLastLoginOnce();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, session, loading, signOut };
};
