import { TabsWithUrl } from "@/components/tao/TabsWithUrl";
import { Markdown } from "@/components/tao/Markdown";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { docs, tabs } from "./content";

export const dynamic = "force-dynamic";

export default function DocsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const defaultTab = searchParams?.tab ?? "overview";

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Documentation</h1>
      <TabsWithUrl defaultTab={defaultTab}>
        <TabsList>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <Markdown content={docs[t.id]} />
          </TabsContent>
        ))}
      </TabsWithUrl>
    </div>
  );
}
