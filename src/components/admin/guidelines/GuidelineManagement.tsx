import { GuidelineUpload } from "./GuidelineUpload";
import { GuidelineTable } from "./GuidelineTable";

export const GuidelineManagement = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Carrier Guidelines</h2>
                    <p className="text-muted-foreground">Manage underwriting guidelines, reference guides, and cheat sheets.</p>
                </div>
            </div>

            <div className="grid gap-8">
                <GuidelineUpload />
                <GuidelineTable />
            </div>
        </div>
    );
};
