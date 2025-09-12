import { useState } from "react";
import { Shield, Plus, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const licenses = [
  {
    id: 1,
    state: "Texas",
    npn: "12345678",
    expiresOn: "2024-12-15",
    status: "active" as const
  },
  {
    id: 2,
    state: "California",
    npn: "87654321",
    expiresOn: "2024-03-20",
    status: "expiring_soon" as const
  },
  {
    id: 3,
    state: "Florida",
    npn: "11223344",
    expiresOn: "2023-11-30",
    status: "expired" as const
  }
];

const Compliance = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({
    state: "",
    npn: "",
    expiresOn: ""
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4 text-success" />;
      case "expiring_soon": return <Clock className="h-4 w-4 text-warning" />;
      case "expired": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success/20 text-success">Active</Badge>;
      case "expiring_soon":
        return <Badge className="bg-warning/20 text-warning">Expiring Soon</Badge>;
      case "expired":
        return <Badge className="bg-destructive/20 text-destructive">Expired</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDaysUntilExpiration = (expiresOn: string) => {
    const today = new Date();
    const expiration = new Date(expiresOn);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddLicense = () => {
    // In real app, this would call an API
    console.log("Adding license:", newLicense);
    setNewLicense({ state: "", npn: "", expiresOn: "" });
    setShowAddDialog(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Compliance
          </h1>
          <p className="text-muted-foreground">Manage licenses and stay compliant</p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add License
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New License</DialogTitle>
              <DialogDescription>
                Enter your license information to track expiration dates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={newLicense.state} onValueChange={(value) => setNewLicense(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    {/* Add more states as needed */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="npn">NPN Number</Label>
                <Input
                  id="npn"
                  placeholder="12345678"
                  value={newLicense.npn}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, npn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expires">Expiration Date</Label>
                <Input
                  id="expires"
                  type="date"
                  value={newLicense.expiresOn}
                  onChange={(e) => setNewLicense(prev => ({ ...prev, expiresOn: e.target.value }))}
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleAddLicense} className="flex-1">
                  Add License
                </Button>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert for expiring licenses */}
      {licenses.some(license => license.status === "expiring_soon" || license.status === "expired") && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">License Attention Required</p>
                <p className="text-sm text-muted-foreground">
                  You have licenses that are expired or expiring soon. Please renew them to maintain compliance.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-xs text-muted-foreground">Across all states</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.filter(l => l.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">In good standing</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.filter(l => l.status === "expiring_soon").length}</div>
            <p className="text-xs text-muted-foreground">Within 60 days</p>
          </CardContent>
        </Card>
      </div>

      {/* License Table */}
      <Card className="stat-card">
        <CardHeader>
          <CardTitle>License Details</CardTitle>
          <CardDescription>
            Track all your insurance licenses and renewal dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>NPN Number</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => {
                const daysLeft = getDaysUntilExpiration(license.expiresOn);
                return (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">{license.state}</TableCell>
                    <TableCell>{license.npn}</TableCell>
                    <TableCell>{new Date(license.expiresOn).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(license.status)}
                        {getStatusBadge(license.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        daysLeft < 0 ? 'text-destructive' :
                        daysLeft < 60 ? 'text-warning' :
                        'text-success'
                      }`}>
                        {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Renew
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Resources */}
      <Card className="stat-card">
        <CardHeader>
          <CardTitle>Compliance Resources</CardTitle>
          <CardDescription>
            Important links and information for staying compliant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">State CE Requirements</div>
                <div className="text-sm text-muted-foreground">Continuing education by state</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">NAIC Producer Database</div>
                <div className="text-sm text-muted-foreground">Verify license status</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">DOI Contact Information</div>
                <div className="text-sm text-muted-foreground">Department of Insurance contacts</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Renewal Reminders</div>
                <div className="text-sm text-muted-foreground">Set up email and SMS alerts</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Compliance;