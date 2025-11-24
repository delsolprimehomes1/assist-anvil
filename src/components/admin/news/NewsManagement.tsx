import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useAdminCarrierNews } from "@/hooks/useCarrierNews";
import { NewsList } from "./NewsList";
import { NewsFormDialog } from "./NewsFormDialog";
import { CarrierNews } from "@/hooks/useCarrierNews";

export const NewsManagement = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<CarrierNews | undefined>();
  const [activeTab, setActiveTab] = useState<"draft" | "published" | "archived">("published");

  const { data: draftNews } = useAdminCarrierNews("draft");
  const { data: publishedNews } = useAdminCarrierNews("published");
  const { data: archivedNews } = useAdminCarrierNews("archived");

  const handleEdit = (news: CarrierNews) => {
    setSelectedNews(news);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedNews(undefined);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Carrier News Management</h2>
          <p className="text-muted-foreground">
            Create and manage carrier news and announcements
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create News
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="draft">
            Draft ({draftNews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({publishedNews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({archivedNews?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draft" className="space-y-4">
          <NewsList news={draftNews || []} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <NewsList news={publishedNews || []} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <NewsList news={archivedNews || []} onEdit={handleEdit} />
        </TabsContent>
      </Tabs>

      <NewsFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        news={selectedNews}
      />
    </div>
  );
};
