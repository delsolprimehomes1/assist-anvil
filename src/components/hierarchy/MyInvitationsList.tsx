import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Mail, Clock, CheckCircle, XCircle, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  notes: string | null;
  invited_at: string;
  expires_at: string;
  invitation_token: string;
}

export function MyInvitationsList() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_invitations")
        .select("*")
        .eq("invited_by", user.id)
        .order("invited_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("user_invitations")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      setInvitations((prev) => prev.filter((inv) => inv.id !== deleteId));
      toast.success("Invitation deleted");
    } catch (error: any) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const copyInviteLink = async (token: string, id: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === "accepted") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
          <CheckCircle className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30">
          <XCircle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/30">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No invitations sent yet</p>
        <p className="text-sm">Invitations you send will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {invitations.length} invitation{invitations.length !== 1 ? "s" : ""} sent
        </p>
        <Button variant="ghost" size="sm" onClick={fetchInvitations} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {invitations.map((invitation) => {
        const isExpired = new Date(invitation.expires_at) < new Date();
        const isPending = invitation.status === "pending" && !isExpired;

        return (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{invitation.email}</span>
                <Badge variant="outline" className="capitalize text-xs">
                  {invitation.role}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {getStatusBadge(invitation.status, invitation.expires_at)}
                <span>
                  Sent {formatDistanceToNow(new Date(invitation.invited_at), { addSuffix: true })}
                </span>
              </div>
              {invitation.notes && (
                <p className="text-xs text-muted-foreground mt-1 italic truncate">
                  "{invitation.notes}"
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {isPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyInviteLink(invitation.invitation_token, invitation.id)}
                  title="Copy invite link"
                >
                  {copiedId === invitation.id ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteId(invitation.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Delete invitation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invitation? The recipient will no longer be able to use the invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
