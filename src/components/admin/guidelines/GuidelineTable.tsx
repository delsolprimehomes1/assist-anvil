import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Trash2, Eye, FileText, RefreshCw, AlertCircle, Archive } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const GuidelineTable = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [previewLoading, setPreviewLoading] = useState<string | null>(null);
    const [retryLoading, setRetryLoading] = useState<string | null>(null);

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
        // Poll every 5 seconds if any item is processing
        refetchInterval: (query) => {
            const hasProcessing = query.state.data?.some((g: any) => g.status === 'processing');
            return hasProcessing ? 5000 : false;
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

    const handlePreview = async (guideline: any) => {
        setPreviewLoading(guideline.id);
        try {
            // Priority: file_path -> attempt to derive from file_url -> error
            let path = guideline.file_path;

            if (!path && guideline.file_url) {
                // Fallback attempt for legacy data
                try {
                    const urlObj = new URL(guideline.file_url);
                    const parts = urlObj.pathname.split('/carrier-guidelines/');
                    if (parts.length > 1) path = decodeURIComponent(parts[1]);
                } catch (e) { console.error("URL parse error", e); }
            }

            if (!path) throw new Error("File path not available for private access.");

            const { data, error } = await supabase.storage
                .from('carrier-guidelines')
                .createSignedUrl(path, 3600);

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            toast({
                title: "Preview Failed",
                description: "Could not generate access link. Bucket may be private.",
                variant: "destructive"
            });
        } finally {
            setPreviewLoading(null);
        }
    };

    const handleRetry = async (guidelineId: string) => {
        setRetryLoading(guidelineId);
        try {
            const { error } = await supabase.functions.invoke('process-guideline', {
                body: { guideline_id: guidelineId }
            });
            if (error) throw error;

            toast({ title: "Processing Queued", description: "Retrying extraction and embedding..." });
            // Optimistic update or just invalidate
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
        } catch (error: any) {
            toast({
                title: "Retry Failed",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setRetryLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
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
                    {/* Add Search/Filter controls here in Phase 5 polish */}
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
                                    </TableCell>
                                    <TableCell>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger className="cursor-default">
                                                    {getStatusBadge(doc.status)}
                                                </TooltipTrigger>
                                                {(doc.processing_error || doc.status === 'partial') && (
                                                    <TooltipContent className="max-w-xs bg-destructive text-destructive-foreground border-destructive/20">
                                                        <p className="font-semibold text-xs mb-1">Processing Issue:</p>
                                                        <p className="text-xs">{doc.processing_error || "Content truncated due to limits."}</p>
                                                    </TooltipContent>
                                                )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 space-x-1">
                                        {/* Retry Action */}
                                        {(doc.status === 'error' || doc.status === 'partial') && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-100"
                                                onClick={() => handleRetry(doc.id)}
                                                disabled={retryLoading === doc.id}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${retryLoading === doc.id ? 'animate-spin' : ''}`} />
                                                <span className="sr-only">Retry</span>
                                            </Button>
                                        )}

                                        {/* Preview Action */}
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            onClick={() => handlePreview(doc)}
                                            disabled={previewLoading === doc.id}
                                        >
                                            {previewLoading === doc.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="sr-only">Preview</span>
                                        </Button>

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
