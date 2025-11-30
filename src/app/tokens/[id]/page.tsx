"use client";

import { use } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TokenDetailView } from "@/components/tokens/TokenDetailView";

interface TokenPageProps {
  params: Promise<{ id: string }>;
}

export default function TokenPage({ params }: TokenPageProps) {
  const { id } = use(params);

  return (
    <MainLayout>
      <TokenDetailView tokenId={id} />
    </MainLayout>
  );
}
