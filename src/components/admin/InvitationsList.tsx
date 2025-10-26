import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, RefreshCw, X, Users, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  expires_at: string;
  notes: string | null;
  invited_by: string | null;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  user_roles: Array<{ role: string }>;
}

export const InvitationsList = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .order("invited_at", { ascending: false });

      if (error) throw error;

      // Fetch inviter profiles separately
      const invitationsWithProfiles = await Promise.all(
        (data || []).map(async (invitation) => {
          if (invitation.invited_by) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, email")
              .eq("id", invitation.invited_by)
              .single();
            return { ...invitation, profiles: profile };
          }
          return { ...invitation, profiles: null };
        })
      );

      setInvitations(invitationsWithProfiles as Invitation[]);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast({
        title: "Error loading invitations",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user roles separately
      const usersWithRoles = await Promise.all(
        (data || []).map(async (user) => {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          return { ...user, user_roles: roles || [] };
        })
      );

      setUsers(usersWithRoles as Profile[]);
    } catch (error: any) {
      console.error("Error fetching users:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchInvitations(), fetchUsers()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelInvitation = async () => {
    if (!cancellingId) return;

    try {
      const { error } = await supabase
        .from("user_invitations")
        .update({ status: "cancelled" })
        .eq("id", cancellingId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled successfully",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error("Error cancelling invitation:", error);
      toast({
        title: "Error cancelling invitation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setDeletingUserId(userToDelete.id);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userToDelete.id }
      });

      if (error) throw error;

      toast({
        title: "User removed",
        description: `${userToDelete.name} has been removed from the system`,
      });

      await fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error removing user",
        description: error.message || "Failed to remove user",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
      setUserToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();
    
    if (isExpired && status === "pending") {
      return <Badge variant="destructive">Expired</Badge>;
    }

    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge variant="default">Accepted</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === "pending" && new Date(inv.expires_at) > new Date());

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                Invitations awaiting acceptance
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No pending invitations</p>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium">{invitation.email}</p>
                      <Badge variant="outline">{invitation.role}</Badge>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Invited by {invitation.profiles?.full_name || invitation.profiles?.email || "Unknown"} • 
                      {" "}{formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
                    </p>
                    {invitation.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{invitation.notes}"</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancellingId(invitation.id);
                      setShowCancelDialog(true);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <CardDescription>
            Registered users and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{user.full_name || user.email}</p>
                      {user.user_roles.map((ur, idx) => (
                        <Badge key={idx} variant="outline">{ur.role}</Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserToDelete({ id: user.id, name: user.full_name || user.email });
                      setShowDeleteDialog(true);
                    }}
                    disabled={deletingUserId === user.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingUserId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the invitation and the recipient will no longer be able to use the invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation}>
              Yes, cancel invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to remove <strong>{userToDelete?.name}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This action cannot be undone. This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>User account and authentication access</li>
                <li>Profile information</li>
                <li>All agent data (licenses, compliance records, goals)</li>
                <li>Marketing templates and brand kits</li>
                <li>Training progress</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, remove user permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
