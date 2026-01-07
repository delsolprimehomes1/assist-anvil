import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { format } from "date-fns";

export const ApprovedUsersList = () => {
  const queryClient = useQueryClient();
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("admin-reset-password", {
        body: { user_id: userId, new_password: password },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success(`Password reset successfully for ${resetPasswordUser?.name}`);
      closeResetDialog();
    },
    onError: (error) => {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to reset password");
    },
  });

  const handleRevokeAccess = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to revoke access for ${userName}?`)) {
      revokeAccessMutation.mutate(userId);
    }
  };

  const openResetDialog = (userId: string, userName: string) => {
    setResetPasswordUser({ id: userId, name: userName });
    setNewPassword("");
    setConfirmPassword("");
  };

  const closeResetDialog = () => {
    setResetPasswordUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!resetPasswordUser) return;
    
    resetPasswordMutation.mutate({ userId: resetPasswordUser.id, password: newPassword });
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
                <TableCell className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openResetDialog(user.id, user.full_name || user.email || "User")}
                  >
                    <KeyRound className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
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

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetPasswordUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Password must be at least 8 characters.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeResetDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
