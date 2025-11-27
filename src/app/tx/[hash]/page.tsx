import { MainLayout } from "@/components/layout/MainLayout";
import { TransactionDetail } from "@/components/explorer/TransactionDetail";

interface PageProps {
  params: Promise<{ hash: string }>;
}

export default async function TransactionPage({ params }: PageProps) {
  const { hash } = await params;
  
  return (
    <MainLayout>
      <TransactionDetail txHash={hash} />
    </MainLayout>
  );
}
