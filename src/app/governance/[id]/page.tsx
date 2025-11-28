"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProposalDetailView } from "@/components/governance/ProposalDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProposalDetailPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <MainLayout>
      <ProposalDetailView proposalId={id} />
    </MainLayout>
  );
}
