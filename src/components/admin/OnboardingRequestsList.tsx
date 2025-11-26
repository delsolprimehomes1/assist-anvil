import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

export const OnboardingRequestsList = () => {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["onboarding-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      requestId,
      userId,
      newStatus,
    }: {
      requestId: string;
      userId: string;
      newStatus: "approved" | "rejected";
    }) => {
      // Update request status
      const { error: requestError } = await supabase
        .from("onboarding_requests")
        .update({ status: newStatus })
        .eq("id", requestId);

      if (requestError) throw requestError;

      // Update profile approval status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ approval_status: newStatus })
        .eq("id", userId);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-requests"] });
      toast.success("Status updated successfully");
      setProcessingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update status");
      setProcessingId(null);
    },
  });

  const handleApprove = (requestId: string, userId: string) => {
    setProcessingId(requestId);
    updateStatusMutation.mutate({ requestId, userId, newStatus: "approved" });
  };

  const handleReject = (requestId: string, userId: string) => {
    setProcessingId(requestId);
    updateStatusMutation.mutate({ requestId, userId, newStatus: "rejected" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No onboarding requests found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Agency Code</TableHead>
            <TableHead>Referred By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {request.first_name} {request.last_name}
              </TableCell>
              <TableCell>{request.email}</TableCell>
              <TableCell>{request.phone}</TableCell>
              <TableCell>{request.agency_code || "—"}</TableCell>
              <TableCell>{request.referred_by || "—"}</TableCell>
              <TableCell>
                {format(new Date(request.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "approved"
                      ? "default"
                      : request.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(request.id, request.user_id)}
                      disabled={processingId === request.id}
                      style={{
                        borderColor: "hsl(var(--brand-teal))",
                        color: "hsl(var(--brand-teal))",
                      }}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.id, request.user_id)}
                      disabled={processingId === request.id}
                      className="border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
