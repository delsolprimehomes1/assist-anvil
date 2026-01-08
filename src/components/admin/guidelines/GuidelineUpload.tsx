import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
        // Only allow one file for now to keep metadata mapping simple
        // Logic can be extended for multi-file with shared metadata or per-file metadata later
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
                    coverage_min: coverageMin ? parseFloat(coverageMin) : null,
                    coverage_max: coverageMax ? parseFloat(coverageMax) : null,
                    age_min: ageMin ? parseInt(ageMin) : null,
                    age_max: ageMax ? parseInt(ageMax) : null,
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
            // Reset critical fields? Or keep for next upload?
            // Keeping carrier/product type is usually helpful for batch uploads
            toast({
                title: "Success",
                description: "Guideline uploaded and queued for processing.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const isValid = files.length > 0 && carrierName && productType && documentType && effectiveDate;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Carrier Guidelines</CardTitle>
                <CardDescription>Upload underwriting guides, cheat sheets, or medication lists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* File Upload Zone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

                    {files.length > 0 ? (
                        <div className="space-y-2">
                            {files.map(f => (
                                <div key={f.name} className="flex items-center justify-center gap-2 text-primary font-medium">
                                    <FileText className="h-4 w-4" />
                                    {f.name}
                                    <span className="text-xs text-muted-foreground">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFiles([]); }}>
                                Replace File
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <p className="font-medium text-foreground mb-1">
                                {isDragActive ? "Drop file here" : "Drag & drop PDF or DOCX"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Max 50MB per file
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Carrier Name *</Label>
                        {/* Ideally this is a Combobox from existing carriers */}
                        <Input
                            placeholder="e.g. Mutual of Omaha"
                            value={carrierName}
                            onChange={e => setCarrierName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Product Type *</Label>
                        <Select value={productType} onValueChange={setProductType}>
                            <SelectTrigger>
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
                        <Label>Document Type *</Label>
                        <Select value={documentType} onValueChange={setDocumentType}>
                            <SelectTrigger>
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Effective Date *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !effectiveDate && "text-muted-foreground")}>
                                        {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={effectiveDate} onSelect={setEffectiveDate} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Expiration Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !expirationDate && "text-muted-foreground")}>
                                        {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
                                        <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={expirationDate} onSelect={setExpirationDate} disabled={(date) => date < new Date("1900-01-01")} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Coverage Range ($)</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Min" type="number" value={coverageMin} onChange={e => setCoverageMin(e.target.value)} />
                            <span className="py-2">-</span>
                            <Input placeholder="Max" type="number" value={coverageMax} onChange={e => setCoverageMax(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Age Range (Years)</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Min" type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)} />
                            <span className="py-2">-</span>
                            <Input placeholder="Max" type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)} />
                        </div>
                    </div>

                </div>

                <div className="space-y-2">
                    <Label>Notes (Internal)</Label>
                    <Textarea
                        placeholder="Version notes, specific state exclusions, etc."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                    />
                </div>

                <Button
                    className="w-full"
                    size="lg"
                    disabled={!isValid || uploadMutation.isPending}
                    onClick={() => uploadMutation.mutate()}
                >
                    {uploadMutation.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing Upload...
                        </>
                    ) : (
                        "Upload & Process Guideline"
                    )}
                </Button>

            </CardContent>
        </Card>
    );
};
