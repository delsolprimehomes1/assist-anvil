
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface ReferencePanelProps {
    isOpen: boolean;
    onClose: () => void;
    citation: string | null;
    content: string | null;
}

export function ReferencePanel({ isOpen, onClose, citation, content }: ReferencePanelProps) {
    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Source Reference
                    </SheetTitle>
                    <SheetDescription>
                        Excerpts from: {citation || "Unknown Source"}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
                    {content ? (
                        <div className="prose prose-sm dark:prose-invert">
                            <blockquote className="border-l-4 border-primary pl-4 italic bg-muted/30 p-4 rounded-r-lg">
                                "{content}"
                            </blockquote>
                            <p className="mt-4 text-sm text-muted-foreground">
                                This text was retrieved from the uploaded carrier guidelines to support the AI's answer.
                                Always refer to the full official document for complete context.
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                            Select a citation to view source content.
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
