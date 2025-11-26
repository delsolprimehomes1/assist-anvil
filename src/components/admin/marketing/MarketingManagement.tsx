import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MarketingResourcesList } from "./MarketingResourcesList";
import { MarketingResourceFormDialog } from "./MarketingResourceFormDialog";

export const MarketingManagement = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);

  const handleEdit = (resource: any) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingResource(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Marketing Resources</h2>
          <p className="text-muted-foreground">
            Manage templates, scripts, and creatives for all agents
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="mt-6">
          <MarketingResourcesList status="published" onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <MarketingResourcesList status="draft" onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          <MarketingResourcesList status="archived" onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <MarketingResourceFormDialog
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        resource={editingResource}
      />
    </div>
  );
};
