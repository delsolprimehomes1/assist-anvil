import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export const ApprovedUsersList = () => {
  const queryClient = useQueryClient();

  const { data: approvedUsers, isLoading } = useQuery({
    queryKey: ["approved-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "approved")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "rejected" })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      queryClient.invalidateQueries({ queryKey: ["rejected-users"] });
      toast.success("User access revoked successfully");
    },
    onError: (error) => {
      console.error("Error revoking access:", error);
      toast.error("Failed to revoke user access");
    },
  });

  const handleRevokeAccess = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to revoke access for ${userName}?`)) {
      revokeAccessMutation.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Approved Users
          </h3>
          <p className="text-sm text-muted-foreground">
            Users with active access to BattersBox
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {approvedUsers?.length || 0} approved
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Approved Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvedUsers && approvedUsers.length > 0 ? (
            approvedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                <TableCell>{user.email || "—"}</TableCell>
                <TableCell>
                  {format(new Date(user.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRevokeAccess(user.id, user.full_name || user.email || "User")}
                    disabled={revokeAccessMutation.isPending}
                  >
                    {revokeAccessMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Revoke Access"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No approved users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
