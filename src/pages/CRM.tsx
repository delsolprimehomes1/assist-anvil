import { useState } from "react";
import { Users, Search, Plus, Filter, Phone, Mail, Calendar, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CRM = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock contact data
  const contacts = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "(555) 123-4567",
      company: "Acme Corp",
      status: "Active",
      lastContact: "2024-01-15",
      value: "$45,000"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@techstart.io",
      phone: "(555) 234-5678",
      company: "TechStart",
      status: "Lead",
      lastContact: "2024-01-14",
      value: "$12,000"
    },
    {
      id: 3,
      name: "Michael Chen",
      email: "m.chen@designco.com",
      phone: "(555) 345-6789",
      company: "DesignCo",
      status: "Active",
      lastContact: "2024-01-13",
      value: "$78,000"
    }
  ];

  const stats = [
    { label: "Total Contacts", value: "1,247", icon: Users },
    { label: "Active Clients", value: "892", icon: Users },
    { label: "This Month", value: "156", icon: Calendar },
    { label: "Follow-ups Due", value: "23", icon: Phone }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and interactions
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Contacts Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="text-muted-foreground">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span className="text-muted-foreground">{contact.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.status === "Active" ? "default" : "secondary"}>
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.lastContact}</TableCell>
                  <TableCell className="font-semibold">{contact.value}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRM;
