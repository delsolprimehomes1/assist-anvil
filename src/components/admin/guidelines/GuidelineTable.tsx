import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, Eye, FileText, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
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
            if (data?.some((g: any) => g.status === 'processing')) {
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

            if (error) {
                // Revert to error status if invoke fails
                await supabase
                    .from("carrier_guidelines")
                    .update({
                        status: 'error',
                        processing_error: `Retry failed: ${error.message}`
                    })
                    .eq('id', id);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
            toast({ title: "Processing restarted" });
        },
        onError: (err: Error) => {
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
            toast({ title: "Failed to retry", description: err.message, variant: "destructive" });
        }
    });

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

    const getStatusBadge = (status: string, doc: any) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500 hover:bg-green-600 border-green-600/20 text-green-50">Active</Badge>;
            case 'processing':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20 flex gap-1 items-center">
                        <Loader2 className="h-3 w-3 animate-spin" /> Processing
                    </Badge>
                );
            case 'partial':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-amber-600/20">Partial</Badge>;
            case 'error':
                return <Badge variant="destructive" className="flex gap-1 items-center"><AlertCircle className="h-3 w-3" /> Error</Badge>;
            case 'archived':
                return <Badge variant="secondary">Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            <p className="text-muted-foreground text-sm">Loading guidelines...</p>
        </div>
    );

    return (
        <Card className="shadow-lg border-border/50">
            <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Guideline Library</CardTitle>
                        <CardDescription>Manage uploaded carrier documents and processing status.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {guidelines && guidelines.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[250px] pl-6">Carrier / Product</TableHead>
                                <TableHead>Document Type</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Stats</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {guidelines.map((doc: any) => (
                                <TableRow key={doc.id} className="group hover:bg-muted/5">
                                    <TableCell className="pl-6">
                                        <div className="font-medium text-foreground">{doc.carrier_name}</div>
                                        <div className="text-sm text-muted-foreground">{doc.product_type}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground/70" />
                                            <span className="text-sm">{doc.document_type}</span>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[180px] cursor-help border-b border-dotted border-muted-foreground/30">{doc.file_name}</div>
                                                </TooltipTrigger>
                                                <TooltipContent>{doc.file_name}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs space-y-1">
                                            <div><span className="text-muted-foreground">Eff:</span> {doc.effective_date ? format(new Date(doc.effective_date), 'MMM d, yyyy') : 'N/A'}</div>
                                            {doc.expiration_date && <div><span className="text-muted-foreground">Exp:</span> {format(new Date(doc.expiration_date), 'MMM d, yyyy')}</div>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {doc.chunks_processed_count > 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                {doc.chunks_processed_count} chunks
                                            </div>
                                        )}
                                        {doc.processing_time_ms > 0 && (
                                            <div className="text-[10px] text-muted-foreground/70">
                                                {(doc.processing_time_ms / 1000).toFixed(1)}s
                                            </div>
                                        )}
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

                                        {/* Delete Action */}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if (confirm("Are you sure you want to delete this guideline? This will remove it from the knowledge base.")) {
                                                    deleteMutation.mutate(doc.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                            <FileText className="h-8 w-8 opacity-50" />
                        </div>
                        <p className="font-medium">No guidelines found</p>
                        <p className="text-sm">Upload documents to start building your knowledge base.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};