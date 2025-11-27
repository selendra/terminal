import { MainLayout } from "@/components/layout/MainLayout";
import { AccountDetail } from "@/components/explorer/AccountDetail";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default async function AddressPage({ params }: PageProps) {
  const { address } = await params;
  
  return (
    <MainLayout>
      <AccountDetail address={address} />
    </MainLayout>
  );
}
