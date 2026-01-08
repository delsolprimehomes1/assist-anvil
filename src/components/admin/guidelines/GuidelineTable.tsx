import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Eye, FileText, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const GuidelineTable = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: guidelines, isLoading } = useQuery({
        queryKey: ["carrier-guidelines"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("carrier_guidelines")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Soft delete or hard delete? 
            // For now hard delete to keep it simple in dev
            const { error } = await supabase
                .from("carrier_guidelines")
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
            toast({ title: "Guideline deleted" });
        },
        onError: (err: Error) => {
            toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
        }
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
            case 'processing': return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
            case 'error': return <Badge variant="destructive">Error</Badge>;
            case 'archived': return <Badge variant="secondary">Archived</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) return <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Guideline Library</CardTitle>
            </CardHeader>
            <CardContent>
                {guidelines && guidelines.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Carrier / Product</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Effective Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {guidelines.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell>
                                        <div className="font-medium">{doc.carrier_name}</div>
                                        <div className="text-sm text-muted-foreground">{doc.product_type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">{doc.document_type}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</div>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(doc.effective_date), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    {getStatusBadge(doc.status)}
                                                </TooltipTrigger>
                                                {doc.processing_error && (
                                                    <TooltipContent>
                                                        <p className="text-red-500 text-xs">{doc.processing_error}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="icon" variant="ghost" asChild>
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this guideline?")) {
                                                    deleteMutation.mutate(doc.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-10 text-muted-foreground">
                        No guidelines uploaded yet.
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
