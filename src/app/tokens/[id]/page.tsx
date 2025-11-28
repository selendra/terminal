"use client";

import { use } from "react";
import { TokenDetailView } from "@/components/tokens/TokenDetailView";

interface TokenPageProps {
  params: Promise<{ id: string }>;
}

export default function TokenPage({ params }: TokenPageProps) {
  const { id } = use(params);
  
  return <TokenDetailView tokenId={id} />;
}
