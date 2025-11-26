import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { format } from "date-fns";

export const RejectedUsersList = () => {
  const queryClient = useQueryClient();

  const { data: rejectedUsers, isLoading } = useQuery({
    queryKey: ["rejected-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approval_status", "rejected")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const reapproveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approval_status: "approved" })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rejected-users"] });
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      toast.success("User re-approved successfully");
    },
    onError: (error) => {
      console.error("Error re-approving user:", error);
      toast.error("Failed to re-approve user");
    },
  });

  const handleReapprove = (userId: string) => {
    reapproveMutation.mutate(userId);
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
            <XCircle className="h-5 w-5 text-red-500" />
            Rejected Users
          </h3>
          <p className="text-sm text-muted-foreground">
            Users whose access has been denied or revoked
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {rejectedUsers?.length || 0} rejected
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rejected Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rejectedUsers && rejectedUsers.length > 0 ? (
            rejectedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name || "—"}</TableCell>
                <TableCell>{user.email || "—"}</TableCell>
                <TableCell>
                  {format(new Date(user.updated_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleReapprove(user.id)}
                    disabled={reapproveMutation.isPending}
                  >
                    {reapproveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Re-approve"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No rejected users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
