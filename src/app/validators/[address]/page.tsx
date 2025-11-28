"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ValidatorDetailView } from "@/components/validators/ValidatorDetailView";

interface PageProps {
  params: Promise<{ address: string }>;
}

export default function ValidatorDetailPage({ params }: PageProps) {
  const { address } = use(params);

  return (
    <MainLayout>
      <ValidatorDetailView validatorAddress={address} />
    </MainLayout>
  );
}
