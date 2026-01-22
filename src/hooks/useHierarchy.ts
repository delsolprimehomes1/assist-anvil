import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface HierarchyAgent {
  id: string;
  userId: string;
  parentId: string | null;
  path: string;
  depth: number;
  status: "active" | "inactive" | "terminated";
  tier: "new_agent" | "producer" | "power_producer" | "elite";
  monthlyGoal: number;
  ytdPremium: number;
  lastActivityAt: string;
  licenseStates: string[];
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UseHierarchyReturn {
  agents: HierarchyAgent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useHierarchy = (): UseHierarchyReturn => {
  const [agents, setAgents] = useState<HierarchyAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchHierarchy = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch hierarchy agents with profile data
      // Using any type since hierarchy_agents table was just created
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
          updated_at
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

      // Transform data to match interface
      const transformedAgents: HierarchyAgent[] = (data || []).map((agent: any) => {
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
          licenseStates: agent.license_states || [],
          fullName: profile.full_name || "Unknown Agent",
          email: profile.email || "",
          avatarUrl: profile.avatar_url,
          createdAt: agent.created_at,
          updatedAt: agent.updated_at,
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

  useEffect(() => {
    fetchHierarchy();
  }, [user]);

  return {
    agents,
    loading,
    error,
    refetch: fetchHierarchy,
  };
};
