import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, FileText, ExternalLink, RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const GuidelineTable = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [previewingId, setPreviewingId] = useState<string | null>(null);

    const { data: guidelines, isLoading } = useQuery({
        queryKey: ["carrier-guidelines"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("carrier_guidelines")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
        // Poll every 5 seconds if any guidelines are processing
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.some(g => g.status === 'processing')) {
                return 5000;
            }
            return false;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
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

    const retryMutation = useMutation({
        mutationFn: async (id: string) => {
            // First update status to processing
            await supabase
                .from("carrier_guidelines")
                .update({ status: 'processing', processing_error: null })
                .eq('id', id);

            // Then invoke the edge function
            const { error } = await supabase.functions.invoke('process-guideline', {
                body: { guideline_id: id }
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
            toast({ title: "Processing restarted" });
        },
        onError: (err: Error) => {
            toast({ title: "Failed to retry", description: err.message, variant: "destructive" });
        }
    });

    // Handle preview with signed URL for private bucket
    const handlePreview = async (doc: any) => {
        setPreviewingId(doc.id);
        try {
            // Use file_path if available, otherwise extract from file_url
            const filePath = doc.file_path || extractFilePathFromUrl(doc.file_url);
            
            if (!filePath) {
                throw new Error('Could not determine file path');
            }

            // Generate signed URL (valid for 1 hour)
            const { data, error } = await supabase.storage
                .from('carrier-guidelines')
                .createSignedUrl(filePath, 3600);

            if (error) throw error;

            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            console.error('Preview error:', error);
            toast({ 
                title: "Failed to preview document", 
                description: error.message,
                variant: "destructive" 
            });
        } finally {
            setPreviewingId(null);
        }
    };

    // Extract file path from storage URL
    const extractFilePathFromUrl = (fileUrl: string): string | null => {
        try {
            const patterns = [
                '/storage/v1/object/public/carrier-guidelines/',
                '/storage/v1/object/sign/carrier-guidelines/',
                '/storage/v1/object/authenticated/carrier-guidelines/',
                '/carrier-guidelines/',
            ];
            
            for (const pattern of patterns) {
                const idx = fileUrl.indexOf(pattern);
                if (idx !== -1) {
                    let path = fileUrl.substring(idx + pattern.length);
                    // Remove query params
                    path = path.split('?')[0];
                    return decodeURIComponent(path);
                }
            }
            
            // Fallback: split by bucket name
            const parts = fileUrl.split('/carrier-guidelines/');
            if (parts.length > 1) {
                return decodeURIComponent(parts[1].split('?')[0]);
            }
            
            return null;
        } catch {
            return null;
        }
    };

    const getStatusBadge = (status: string, doc: any) => {
        const chunksInfo = doc.chunks_processed_count > 0 
            ? ` (${doc.chunks_processed_count} chunks)` 
            : '';
        
        switch (status) {
            case 'active': 
                return <Badge className="bg-green-500 hover:bg-green-600">Active{chunksInfo}</Badge>;
            case 'processing': 
                return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
            case 'partial': 
                return <Badge className="bg-amber-500 hover:bg-amber-600">Partial{chunksInfo}</Badge>;
            case 'error': 
                return <Badge variant="destructive">Error</Badge>;
            case 'archived': 
                return <Badge variant="secondary">Archived</Badge>;
            default: 
                return <Badge variant="outline">{status}</Badge>;
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
                                        {doc.effective_date && format(new Date(doc.effective_date), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    {getStatusBadge(doc.status, doc)}
                                                </TooltipTrigger>
                                                {(doc.processing_error || doc.processing_time_ms) && (
                                                    <TooltipContent className="max-w-xs">
                                                        {doc.processing_error && (
                                                            <p className="text-red-500 text-xs mb-1">{doc.processing_error}</p>
                                                        )}
                                                        {doc.processing_time_ms && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Processed in {(doc.processing_time_ms / 1000).toFixed(1)}s
                                                            </p>
                                                        )}
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        {/* Retry button - shows for error or partial status */}
                                        {(doc.status === 'error' || doc.status === 'partial') && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-amber-600 hover:text-amber-700"
                                                            onClick={() => retryMutation.mutate(doc.id)}
                                                            disabled={retryMutation.isPending}
                                                        >
                                                            {retryMutation.isPending ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <RefreshCw className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Retry Processing</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                        {/* Preview button with signed URL */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button 
                                                        size="icon" 
                                                        variant="ghost"
                                                        disabled={previewingId === doc.id}
                                                        onClick={() => handlePreview(doc)}
                                                    >
                                                        {previewingId === doc.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <ExternalLink className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Preview Document</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
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