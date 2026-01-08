import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Calendar as CalendarIcon, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

export const GuidelineUpload = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [files, setFiles] = useState<File[]>([]);

    // Metadata Form State
    const [carrierName, setCarrierName] = useState("");
    const [productType, setProductType] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [coverageMin, setCoverageMin] = useState("");
    const [coverageMax, setCoverageMax] = useState("");
    const [ageMin, setAgeMin] = useState("");
    const [ageMax, setAgeMax] = useState("");
    const [effectiveDate, setEffectiveDate] = useState<Date>();
    const [expirationDate, setExpirationDate] = useState<Date>();
    const [notes, setNotes] = useState("");

    const onDrop = (acceptedFiles: File[]) => {
        setFiles(acceptedFiles.slice(0, 1));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        }
    });

    const uploadMutation = useMutation({
        mutationFn: async () => {
            const file = files[0];
            if (!file) throw new Error("No file selected");

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${carrierName}/${productType}/${Date.now()}_${file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('carrier-guidelines')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('carrier-guidelines')
                .getPublicUrl(filePath);

            // 2. Insert Metadata into Database
            const { data: insertedData, error: dbError } = await supabase
                .from("carrier_guidelines")
                .insert({
                    carrier_name: carrierName,
                    product_type: productType,
                    document_type: documentType,
                    file_name: file.name,
                    file_url: publicUrl,
                    file_size: file.size,
                    min_coverage: coverageMin ? parseFloat(coverageMin) : null,
                    max_coverage: coverageMax ? parseFloat(coverageMax) : null,
                    min_age: ageMin ? parseInt(ageMin) : null,
                    max_age: ageMax ? parseInt(ageMax) : null,
                    effective_date: effectiveDate ? format(effectiveDate, 'yyyy-MM-dd') : null,
                    expiration_date: expirationDate ? format(expirationDate, 'yyyy-MM-dd') : null,
                    status: 'processing',
                    notes: notes,
                    uploaded_by: user.id
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // 3. Trigger Processing
            const { error: fnError } = await supabase.functions.invoke('process-guideline', {
                body: { guideline_id: insertedData.id }
            });

            if (fnError) {
                console.error("Processing trigger failed:", fnError);
                toast({
                    title: "Processing Warning",
                    description: "Upload successful but auto-processing failed to start.",
                    variant: "destructive"
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["carrier-guidelines"] });
            setFiles([]);
            setNotes("");
            // Optional: reset other fields if bulk upload flow desires it, 
            // but often users upload multiple docs for same carrier/product, so keeping some state is UX friendly.
            toast({
                title: "Processing Started",
                description: "The guideline has been uploaded and queued for ingestion.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Upload Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const isValid = files.length > 0 && carrierName && productType && documentType && effectiveDate;

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-lg border-border/50">
            <CardHeader className="bg-muted/20 border-b border-border/50 pb-6">
                <CardTitle className="text-xl">Upload Carrier Guidelines</CardTitle>
                <CardDescription>
                    Add new underwriting documents to the RAG knowledge base.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 pt-8">

                {/* Step 1: Upload */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">1</div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Document Source</h3>
                    </div>

                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ease-in-out",
                            isDragActive
                                ? "border-primary bg-primary/5 scale-[0.99]"
                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                        )}
                    >
                        <input {...getInputProps()} />

                        {files.length > 0 ? (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <p className="font-medium text-lg text-foreground mb-1">{files[0].name}</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {(files[0].size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); setFiles([]); }}
                                    className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                >
                                    <X className="h-3 w-3" /> Remove File
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="p-4 rounded-full bg-muted mb-2">
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium text-foreground">
                                    {isDragActive ? "Drop file here" : "Click to upload or drag and drop"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Supports PDF and DOCX (Max 50MB)
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                <Separator />

                {/* Step 2: Core Details */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">2</div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Core Metadata</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase">Carrier Name <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="e.g. Mutual of Omaha"
                                value={carrierName}
                                onChange={e => setCarrierName(e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase">Product Type <span className="text-destructive">*</span></Label>
                            <Select value={productType} onValueChange={setProductType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Product" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Term Life">Term Life</SelectItem>
                                    <SelectItem value="Whole Life">Whole Life</SelectItem>
                                    <SelectItem value="Universal Life">Universal Life</SelectItem>
                                    <SelectItem value="IUL">Indexed Universal Life (IUL)</SelectItem>
                                    <SelectItem value="VUL">Variable Universal Life (VUL)</SelectItem>
                                    <SelectItem value="Final Expense">Final Expense</SelectItem>
                                    <SelectItem value="Disability">Disability</SelectItem>
                                    <SelectItem value="Critical Illness">Critical Illness</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground uppercase">Document Type <span className="text-destructive">*</span></Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Full Underwriting Guidelines">Full Underwriting Guidelines</SelectItem>
                                    <SelectItem value="Quick Reference Guide">Quick Reference Guide</SelectItem>
                                    <SelectItem value="Medication Guide">Medication Guide</SelectItem>
                                    <SelectItem value="Financial Guidelines">Financial Guidelines</SelectItem>
                                    <SelectItem value="Build Chart">Build Chart</SelectItem>
                                    <SelectItem value="Foreign Travel">Foreign Travel</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </section>

                <Separator />

                {/* Step 3: Rules & Validity */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">3</div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Validity Rules</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Dates Group */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Effective Date <span className="text-destructive">*</span></Label>
                                <Input
                                    type="date"
                                    className="bg-background block w-full"
                                    value={effectiveDate ? format(effectiveDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                        if (!e.target.value) {
                                            setEffectiveDate(undefined);
                                            return;
                                        }
                                        const [y, m, d] = e.target.value.split('-').map(Number);
                                        setEffectiveDate(new Date(y, m - 1, d));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Expiration Date</Label>
                                <Input
                                    type="date"
                                    className="bg-background block w-full"
                                    value={expirationDate ? format(expirationDate, "yyyy-MM-dd") : ""}
                                    min={effectiveDate ? format(effectiveDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => {
                                        if (!e.target.value) {
                                            setExpirationDate(undefined);
                                            return;
                                        }
                                        const [y, m, d] = e.target.value.split('-').map(Number);
                                        setExpirationDate(new Date(y, m - 1, d));
                                    }}
                                />
                            </div>
                        </div>

                        {/* Ranges Group */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Coverage Range ($)</Label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Min"
                                            type="number"
                                            className="pl-8 bg-background"
                                            value={coverageMin}
                                            onChange={e => setCoverageMin(e.target.value)}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    </div>
                                    <span className="text-muted-foreground">-</span>
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Max"
                                            type="number"
                                            className="pl-8 bg-background"
                                            value={coverageMax}
                                            onChange={e => setCoverageMax(e.target.value)}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase">Age Range (Yrs)</Label>
                                <div className="flex items-center gap-2">
                                    <Input placeholder="0" type="number" className="bg-background" value={ageMin} onChange={e => setAgeMin(e.target.value)} />
                                    <span className="text-muted-foreground">-</span>
                                    <Input placeholder="121" type="number" className="bg-background" value={ageMax} onChange={e => setAgeMax(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        {/* Notes - moved here to balance grid or keep bottom full width? Let's keep bottom full width as Step 4 */}
                    </div>
                </section>

                <Separator />

                {/* Step 4: Finalize */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold ring-1 ring-primary/20">4</div>
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Notes & Submit</h3>
                    </div>

                    <div className="space-y-2">
                        <Label className="sr-only">Internal Notes</Label>
                        <Textarea
                            placeholder="Add any internal notes about this document version, state exclusions, or special handling instructions..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="bg-background min-h-[100px]"
                        />
                    </div>
                </section>

            </CardContent>

            <CardFooter className="bg-muted/10 border-t border-border/50 p-6 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => {
                    setFiles([]);
                    setCarrierName("");
                    setProductType("");
                    setDocumentType("");
                    setEffectiveDate(undefined);
                    setNotes("");
                    // reset others as needed
                }}>
                    Discard
                </Button>
                <Button
                    size="lg"
                    disabled={!isValid || uploadMutation.isPending}
                    onClick={() => uploadMutation.mutate()}
                    className="min-w-[200px] shadow-md transition-all hover:shadow-lg hover:bg-primary/90"
                >
                    {uploadMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload & Process
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
};
