import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedAgent } from "@/lib/licensing-logic";

interface UseHierarchyReturn {
  agents: EnhancedAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  moveAgent: (agentUserId: string, newParentUserId: string) => Promise<void>;
  isMoving: boolean;
}

export const useHierarchy = (): UseHierarchyReturn => {
  const [agents, setAgents] = useState<EnhancedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const { user } = useAuth();

  const fetchHierarchy = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch hierarchy agents with all new columns
      const { data, error: fetchError } = await supabase
        .from("hierarchy_agents" as any)
        .select(`
          id,
          user_id,
          parent_id,
          path,
          depth,
          status,
          tier,
          monthly_goal,
          ytd_premium,
          last_activity_at,
          license_states,
          created_at,
          updated_at,
          verification_complete,
          joined_at,
          last_login_at,
          contracts_pending,
          contracts_approved,
          resident_license_exp,
          ce_due_date
        `)
        .order("path");

      if (fetchError) {
        throw fetchError;
      }

      // Fetch profiles separately for the user data
      const userIds = (data || []).map((a: any) => a.user_id).filter(Boolean);
      
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", userIds);
        
        profilesMap = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      // Transform data to match EnhancedAgent interface
      const transformedAgents: EnhancedAgent[] = (data || []).map((agent: any) => {
        const profile = profilesMap[agent.user_id] || {};
        return {
          id: agent.id,
          userId: agent.user_id,
          parentId: agent.parent_id,
          path: agent.path,
          depth: agent.depth,
          status: agent.status,
          tier: agent.tier,
          monthlyGoal: parseFloat(agent.monthly_goal) || 10000,
          ytdPremium: parseFloat(agent.ytd_premium) || 0,
          lastActivityAt: agent.last_activity_at,
          lastLoginAt: agent.last_login_at,
          joinedAt: agent.joined_at,
          verificationComplete: agent.verification_complete || false,
          contractsPending: agent.contracts_pending || 0,
          contractsApproved: agent.contracts_approved || 0,
          residentLicenseExp: agent.resident_license_exp,
          ceDueDate: agent.ce_due_date,
          licenseStates: agent.license_states || [],
          fullName: profile.full_name || "Unknown Agent",
          email: profile.email || "",
          avatarUrl: profile.avatar_url,
        };
      });

      setAgents(transformedAgents);
    } catch (err) {
      console.error("Error fetching hierarchy:", err);
      setError(err instanceof Error ? err.message : "Failed to load hierarchy");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchHierarchy();
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("hierarchy-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hierarchy_agents",
        },
        () => {
          // Refetch when changes occur
          fetchHierarchy();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Move an agent to a new parent using the RPC function
  const moveAgent = async (agentUserId: string, newParentUserId: string) => {
    setIsMoving(true);
    try {
      const { error: rpcError } = await supabase.rpc('move_agent_subtree', {
        _agent_id: agentUserId,
        _new_parent_id: newParentUserId,
      });

      if (rpcError) {
        // Handle specific error messages from the DB function
        if (rpcError.message.includes('descendant')) {
          throw new Error('Cannot move an agent under their own team member');
        }
        if (rpcError.message.includes('not found')) {
          throw new Error('Agent or manager not found. Please refresh and try again.');
        }
        throw new Error(rpcError.message);
      }

      // Refetch will also happen via realtime subscription, but we call it explicitly for immediate feedback
      await fetchHierarchy();
    } finally {
      setIsMoving(false);
    }
  };

  return {
    agents,
    loading,
    error,
    refetch: fetchHierarchy,
    moveAgent,
    isMoving,
  };
};

// Re-export HierarchyAgent type for backwards compatibility
export type HierarchyAgent = EnhancedAgent;
