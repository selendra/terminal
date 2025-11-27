import { MainLayout } from "@/components/layout/MainLayout";
import { StakingDashboard } from "@/components/staking/StakingDashboard";

export default function StakingPage() {
  return (
    <MainLayout>
      <StakingDashboard />
    </MainLayout>
  );
}
