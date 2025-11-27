import { MainLayout } from "@/components/layout/MainLayout";
import { GovernanceDashboard } from "@/components/governance/GovernanceDashboard";

export default function GovernancePage() {
  return (
    <MainLayout>
      <GovernanceDashboard />
    </MainLayout>
  );
}
