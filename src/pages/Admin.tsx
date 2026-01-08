import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Users, BarChart3, FileText, Database, Shield, Loader2, Mail, Trash2, UserCheck, UserPlus, Newspaper } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { CarriersList } from "@/components/admin/CarriersList";
import { InviteAgentDialog } from "@/components/admin/InviteAgentDialog";
import { InvitationsList } from "@/components/admin/InvitationsList";
import { OnboardingRequestsList } from "@/components/admin/OnboardingRequestsList";
import { PendingUsersList } from "@/components/admin/PendingUsersList";
import { ApprovedUsersList } from "@/components/admin/ApprovedUsersList";
import { RejectedUsersList } from "@/components/admin/RejectedUsersList";
import { TrainingManagementTab } from "@/components/admin/training/TrainingManagementTab";
import { ScheduleManagement } from "@/components/admin/schedule/ScheduleManagement";
import { NewsManagement } from "@/components/admin/news/NewsManagement";
import { MarketingManagement } from "@/components/admin/marketing/MarketingManagement";
import { GuidelineManagement } from "@/components/admin/guidelines/GuidelineManagement";

type ApprovedEmail = {
  id: string;
  email: string;
  added_by: string | null;
  added_at: string;
  notes: string | null;
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [approvedEmails, setApprovedEmails] = useState<ApprovedEmail[]>([]);
  const [emailForm, setEmailForm] = useState({ email: "", notes: "" });
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin dashboard.",
          variant: "destructive",
        });
        navigate("/");
      } else {
        fetchApprovedEmails();
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate, toast]);

  const fetchApprovedEmails = async () => {
    setLoadingEmails(true);
    const { data, error } = await supabase
      .from("approved_admin_emails")
      .select("*")
      .order("added_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load approved emails.",
        variant: "destructive",
      });
    } else {
      setApprovedEmails(data || []);
    }
    setLoadingEmails(false);
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(emailForm.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("approved_admin_emails")
      .insert({
        email: emailForm.email.toLowerCase().trim(),
        added_by: user?.id,
        notes: emailForm.notes.trim() || null,
      });

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes("duplicate")
          ? "This email is already approved."
          : "Failed to add email.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `${emailForm.email} has been approved for admin access.`,
      });
      setEmailForm({ email: "", notes: "" });
      fetchApprovedEmails();
    }
  };

  const handleDeleteEmail = async (id: string, email: string) => {
    const { error } = await supabase
      .from("approved_admin_emails")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove email.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed",
        description: `${email} has been removed from approved list.`,
      });
      fetchApprovedEmails();
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }


  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage content, users, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="h-auto flex w-full overflow-x-auto gap-1 p-1 justify-start scrollbar-hide">
          <TabsTrigger value="approvals" className="whitespace-nowrap px-4 py-2">Admin Approvals</TabsTrigger>
          <TabsTrigger value="carriers" className="whitespace-nowrap px-4 py-2">Carriers</TabsTrigger>
          <TabsTrigger value="users" className="whitespace-nowrap px-4 py-2">Users</TabsTrigger>
          <TabsTrigger value="user-management" className="whitespace-nowrap px-4 py-2">User Management</TabsTrigger>
          <TabsTrigger value="onboarding" className="whitespace-nowrap px-4 py-2">Onboarding</TabsTrigger>
          <TabsTrigger value="analytics" className="whitespace-nowrap px-4 py-2">Analytics</TabsTrigger>
          <TabsTrigger value="settings" className="whitespace-nowrap px-4 py-2">Settings</TabsTrigger>
          <TabsTrigger value="training" className="whitespace-nowrap px-4 py-2">Training</TabsTrigger>
          <TabsTrigger value="schedule" className="whitespace-nowrap px-4 py-2">Schedule</TabsTrigger>
          <TabsTrigger value="news" className="whitespace-nowrap px-4 py-2">Carrier News</TabsTrigger>
          <TabsTrigger value="marketing" className="whitespace-nowrap px-4 py-2">Marketing</TabsTrigger>
          <TabsTrigger value="guidelines" className="whitespace-nowrap px-4 py-2">Carrier Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-6">
          <TrainingManagementTab />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <ScheduleManagement />
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <NewsManagement />
        </TabsContent>

        <TabsContent value="marketing" className="space-y-6">
          <MarketingManagement />
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <GuidelineManagement />
        </TabsContent>


        <TabsContent value="approvals" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Approve Admin Access
              </CardTitle>
              <CardDescription>
                Add email addresses that should be granted admin access upon signup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Regional manager - West Coast"
                    value={emailForm.notes}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Approve Email for Admin Access
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Approved Admin Emails</CardTitle>
              <CardDescription>
                Users who sign up with these emails will automatically receive admin access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingEmails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : approvedEmails.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No approved emails yet. Add one above to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {approvedEmails.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 bg-accent/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <p className="font-medium">{item.email}</p>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(item.added_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEmail(item.id, item.email)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <CarriersList />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Invite and manage platform users</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full sm:w-auto" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Agent
              </Button>
            </CardContent>
          </Card>
          <InvitationsList />
        </TabsContent>

        <TabsContent value="user-management" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user access and approval status for BattersBox
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-6">
                  <PendingUsersList />
                </TabsContent>

                <TabsContent value="approved" className="mt-6">
                  <ApprovedUsersList />
                </TabsContent>

                <TabsContent value="rejected" className="mt-6">
                  <RejectedUsersList />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          <OnboardingRequestsList />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                <BarChart3 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">Answered queries</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">456</div>
                <p className="text-xs text-muted-foreground">In knowledge base</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input defaultValue="AgentHub Insurance Group" />
              </div>
              <div className="space-y-2">
                <Label>Default Email Signature</Label>
                <Input defaultValue="Best regards,\nThe AgentHub Team" />
              </div>
              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <InviteAgentDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvitationSent={() => {
          // Refresh will happen automatically when InvitationsList remounts
        }}
      />
    </div>
  );
};

export default Admin;