import { useState } from "react";
import { Settings, Upload, Users, BarChart3, FileText, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const [uploadForm, setUploadForm] = useState({
    title: "",
    carrier: "",
    product: "",
    docType: "",
    state: "",
    version: "",
    file: null as File | null
  });
  const { toast } = useToast();

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // In real app, this would upload to Supabase storage and trigger n8n webhook
    toast({
      title: "Document uploaded",
      description: "Document has been uploaded and processing has started.",
    });
    
    // Reset form
    setUploadForm({
      title: "",
      carrier: "",
      product: "",
      docType: "",
      state: "",
      version: "",
      file: null
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage content, users, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="carriers">Carriers</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Knowledge Document
              </CardTitle>
              <CardDescription>
                Upload PDFs, guides, and other documents to the AI knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Underwriting Guidelines 2024"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carrier">Carrier</Label>
                    <Select value={uploadForm.carrier} onValueChange={(value) => setUploadForm(prev => ({ ...prev, carrier: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="american_general">American General</SelectItem>
                        <SelectItem value="mutual_omaha">Mutual of Omaha</SelectItem>
                        <SelectItem value="foresters">Foresters Financial</SelectItem>
                        <SelectItem value="universal">Universal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Product Type</Label>
                    <Select value={uploadForm.product} onValueChange={(value) => setUploadForm(prev => ({ ...prev, product: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="term">Term Life</SelectItem>
                        <SelectItem value="whole_life">Whole Life</SelectItem>
                        <SelectItem value="final_expense">Final Expense</SelectItem>
                        <SelectItem value="annuity">Annuity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docType">Document Type</Label>
                    <Select value={uploadForm.docType} onValueChange={(value) => setUploadForm(prev => ({ ...prev, docType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="underwriting_guide">Underwriting Guide</SelectItem>
                        <SelectItem value="lookback">Lookback Policy</SelectItem>
                        <SelectItem value="matrix">Decision Matrix</SelectItem>
                        <SelectItem value="product_guide">Product Guide</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State (if applicable)</Label>
                    <Input
                      id="state"
                      placeholder="e.g., TX, CA, FL"
                      value={uploadForm.state}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      placeholder="e.g., 2024.1, v3.2"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, version: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file">Document File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx,.csv"
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: PDF, DOC, DOCX, CSV (max 10MB)
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>Recently uploaded documents and their processing status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { title: "AG Underwriting Guide 2024", status: "processed", date: "2024-01-20" },
                  { title: "MOO Term Life Matrix", status: "processing", date: "2024-01-19" },
                  { title: "FE Health Questions", status: "processed", date: "2024-01-18" }
                ].map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-muted-foreground">Uploaded {doc.date}</p>
                    </div>
                    <Badge variant={doc.status === "processed" ? "default" : "secondary"}>
                      {doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>Manage Carriers</CardTitle>
              <CardDescription>Add, edit, and remove insurance carriers</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>
                <Database className="mr-2 h-4 w-4" />
                Add New Carrier
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="stat-card">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage agent accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Invite Agent
              </Button>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default Admin;