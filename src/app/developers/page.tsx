"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { DeveloperPortal } from "@/components/api/DeveloperPortal";

export default function DeveloperPage() {
  return (
    <MainLayout>
      <DeveloperPortal />
    </MainLayout>
  );
}
