import { MainLayout } from "@/components/layout/MainLayout";
import { BlockDetail } from "@/components/explorer/BlockDetail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BlockPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <MainLayout>
      <BlockDetail blockId={id} />
    </MainLayout>
  );
}
