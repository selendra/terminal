import { MainLayout } from "@/components/layout/MainLayout";
import { ContractDetailView } from "@/components/contracts/ContractDetailView";

interface ContractPageProps {
  params: Promise<{
    address: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function ContractPage({ params, searchParams }: ContractPageProps) {
  const { address } = await params;
  const { tab } = await searchParams;
  
  const validTabs = ["overview", "code", "read", "write", "events", "transactions"] as const;
  const initialTab = validTabs.includes(tab as any) ? (tab as typeof validTabs[number]) : "overview";

  return (
    <MainLayout>
      <ContractDetailView address={address} initialTab={initialTab} />
    </MainLayout>
  );
}
