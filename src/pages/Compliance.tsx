import { useState } from "react";
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useAgentProfile } from "@/hooks/useAgentProfile";
import { useNonResidentLicenses } from "@/hooks/useNonResidentLicenses";
import { useComplianceRecords } from "@/hooks/useComplianceRecords";

const Compliance = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useAgentProfile();
  const { licenses, isLoading: licensesLoading, createLicense } = useNonResidentLicenses();
  const { complianceRecord, isLoading: complianceLoading } = useComplianceRecords();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLicense, setNewLicense] = useState({
    state: "",
    npn: "",
    expiresOn: ""
  });

  const isLoading = authLoading || profileLoading || licensesLoading || complianceLoading;

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

  const handleAddLicense = async () => {
    if (!newLicense.state || !newLicense.npn || !newLicense.expiresOn) {
      return;
    }

    await createLicense.mutateAsync({
      state: newLicense.state,
      license_number: newLicense.npn,
      expiration_date: newLicense.expiresOn,
    });

    setNewLicense({ state: "", npn: "", expiresOn: "" });
    setShowAddDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to view compliance information.</p>
      </div>
    );
  }

  // Combine resident and non-resident licenses
  const allLicenses = [
    ...(profile?.resident_license_number ? [{
      id: 'resident',
      state: profile.resident_state || '',
      license_number: profile.resident_license_number,
      expiration_date: profile.resident_license_exp || '',
      status: profile.resident_license_exp ? 
        (() => {
          const daysUntil = getDaysUntilExpiration(profile.resident_license_exp);
          if (daysUntil < 0) return 'expired';
          if (daysUntil <= 90) return 'expiring_soon';
          return 'active';
        })() : 'active',
      isResident: true,
    }] : []),
    ...licenses.map(l => ({ ...l, isResident: false })),
  ];

  const totalLicenses = allLicenses.length;
  const activeLicenses = allLicenses.filter(l => l.status === 'active').length;
  const expiringSoon = allLicenses.filter(l => l.status === 'expiring_soon').length;
  const hasAlerts = allLicenses.some(l => l.status === 'expiring_soon' || l.status === 'expired');

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
      {hasAlerts && (
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLicenses}</div>
            <p className="text-xs text-muted-foreground">Across all states</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicenses}</div>
            <p className="text-xs text-muted-foreground">In good standing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon}</div>
            <p className="text-xs text-muted-foreground">Within 90 days</p>
          </CardContent>
        </Card>
      </div>

      {/* License Table */}
      <Card>
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
              {allLicenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No licenses added yet. Click "Add License" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                allLicenses.map((license) => {
                  const daysLeft = getDaysUntilExpiration(license.expiration_date);
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">
                        {license.state}
                        {license.isResident && (
                          <Badge variant="secondary" className="ml-2 text-xs">Resident</Badge>
                        )}
                      </TableCell>
                      <TableCell>{license.license_number}</TableCell>
                      <TableCell>{new Date(license.expiration_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(license.status)}
                          {getStatusBadge(license.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          daysLeft < 0 ? 'text-destructive' :
                          daysLeft < 90 ? 'text-warning' :
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
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Compliance Resources */}
      <Card>
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