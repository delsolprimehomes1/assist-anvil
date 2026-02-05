 import { useState } from "react";
 import { Mail, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { Separator } from "@/components/ui/separator";
 import { useToast } from "@/hooks/use-toast";
 
 interface ReparentingInstructions {
   email: string;
   subject: string;
   template: string;
   notes?: string;
 }
 
 interface ReparentingTabContentProps {
   reparenting: ReparentingInstructions;
 }
 
 const ReparentingTabContent = ({ reparenting }: ReparentingTabContentProps) => {
   const { toast } = useToast();
   const [copiedField, setCopiedField] = useState<string | null>(null);
 
   const copyToClipboard = async (text: string, label: string) => {
     try {
       await navigator.clipboard.writeText(text);
       setCopiedField(label);
       toast({
         title: "Copied!",
         description: `${label} copied to clipboard`,
       });
       setTimeout(() => setCopiedField(null), 2000);
     } catch (err) {
       toast({
         title: "Failed to copy",
         description: "Please try again",
         variant: "destructive",
       });
     }
   };
 
   const openEmailClient = () => {
     const mailtoUrl = `mailto:${reparenting.email}?subject=${encodeURIComponent(reparenting.subject)}&body=${encodeURIComponent(reparenting.template)}`;
     window.open(mailtoUrl, '_blank');
   };
 
   return (
     <div className="space-y-6 mt-8 px-1 md:px-0">
       <div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm">
         <h3 className="font-semibold text-base md:text-lg mb-4 flex items-center gap-2">
           <Mail className="h-5 w-5 text-primary" />
           Request a Reparent
         </h3>
         
         <div className="space-y-4">
           {/* Send To */}
           <Card className="p-4">
             <div className="flex items-center justify-between gap-3">
               <div className="min-w-0 flex-1">
                 <p className="text-xs text-muted-foreground mb-1">Send To</p>
                 <p className="font-medium text-sm break-all">{reparenting.email}</p>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 className="h-10 min-w-[80px] shrink-0"
                 onClick={() => copyToClipboard(reparenting.email, "Email")}
               >
                 {copiedField === "Email" ? (
                   <Check className="h-4 w-4" />
                 ) : (
                   <>
                     <Copy className="h-4 w-4 mr-1" />
                     Copy
                   </>
                 )}
               </Button>
             </div>
           </Card>
 
           {/* Subject */}
           <Card className="p-4">
             <div className="flex items-center justify-between gap-3">
               <div className="min-w-0 flex-1">
                 <p className="text-xs text-muted-foreground mb-1">Subject</p>
                 <p className="font-medium text-sm">{reparenting.subject}</p>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 className="h-10 min-w-[80px] shrink-0"
                 onClick={() => copyToClipboard(reparenting.subject, "Subject")}
               >
                 {copiedField === "Subject" ? (
                   <Check className="h-4 w-4" />
                 ) : (
                   <>
                     <Copy className="h-4 w-4 mr-1" />
                     Copy
                   </>
                 )}
               </Button>
             </div>
           </Card>
 
           <Separator />
 
           {/* Email Template */}
           <div>
             <div className="flex items-center justify-between mb-3">
               <h4 className="font-semibold text-sm">Email Template</h4>
               <Button
                 variant="outline"
                 size="sm"
                 className="h-10"
                 onClick={() => copyToClipboard(reparenting.template, "Template")}
               >
                 {copiedField === "Template" ? (
                   <>
                     <Check className="h-4 w-4 mr-1" />
                     Copied!
                   </>
                 ) : (
                   <>
                     <Copy className="h-4 w-4 mr-1" />
                     Copy All
                   </>
                 )}
               </Button>
             </div>
             <Card className="p-4 bg-muted/30">
               <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                 {reparenting.template}
               </pre>
             </Card>
           </div>
 
           <Separator />
 
           {/* Open in Email Client */}
           <Button 
             className="w-full h-12 text-base" 
             onClick={openEmailClient}
           >
             <Mail className="h-5 w-5 mr-2" />
             Open in Email Client
             <ExternalLink className="h-4 w-4 ml-2" />
           </Button>
 
           {/* Note */}
           {reparenting.notes && (
             <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
               <AlertCircle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
               <p className="text-sm text-warning-foreground">
                 {reparenting.notes}
               </p>
             </div>
           )}
         </div>
       </div>
     </div>
   );
 };
 
 export default ReparentingTabContent;