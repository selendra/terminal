import { MainLayout } from "@/components/layout/MainLayout";
import { TransactionsExplorer } from "@/components/explorer/TransactionsExplorer";

export default function TransactionsPage() {
  return (
    <MainLayout>
      <TransactionsExplorer />
    </MainLayout>
  );
}
