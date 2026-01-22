import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, KeyRound, X, Clock } from "lucide-react";
import { format } from "date-fns";

type PasswordResetRequest = {
  id: string;
  email: string;
  full_name: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

export const PasswordResetRequestsList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Fetch pending password reset requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["password-reset-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PasswordResetRequest[];
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      // First find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        throw new Error("User not found with this email address");
      }

      // Call the admin reset password function
      const { error } = await supabase.functions.invoke("admin-reset-password", {
        body: { user_id: profile.id, new_password: password },
      });

      if (error) throw error;
      return profile.id;
    },
    onSuccess: async () => {
      // Update the request status
      if (selectedRequest) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
          .from("password_reset_requests")
          .update({
            status: "completed",
            resolved_at: new Date().toISOString(),
            resolved_by: user?.id,
          })
          .eq("id", selectedRequest.id);
      }

      toast({
        title: "Password Reset",
        description: `Password has been reset for ${selectedRequest?.email}`,
      });
      queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
      closeResetDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Dismiss request mutation
  const dismissMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("password_reset_requests")
        .update({
          status: "dismissed",
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", requestId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Request Dismissed",
        description: "The password reset request has been dismissed.",
      });
      queryClient.invalidateQueries({ queryKey: ["password-reset-requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss request",
        variant: "destructive",
      });
    },
  });

  const openResetDialog = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setNewPassword("");
    setConfirmPassword("");
    setResetDialogOpen(true);
  };

  const closeResetDialog = () => {
    setResetDialogOpen(false);
    setSelectedRequest(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleResetPassword = () => {
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (selectedRequest) {
      resetPasswordMutation.mutate({
        email: selectedRequest.email,
        password: newPassword,
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="stat-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const pendingCount = requests?.length || 0;

  return (
    <>
      <Card className="stat-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Password Reset Requests
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Users who have requested a password reset. Reset their password manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending password reset requests</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => openResetDialog(request)}
                          >
                            <KeyRound className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissMutation.mutate(request.id)}
                            disabled={dismissMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedRequest?.full_name} ({selectedRequest?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters
              </p>
            </div>
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
