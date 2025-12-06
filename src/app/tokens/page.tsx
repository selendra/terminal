import { Suspense } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TokensExplorer } from "@/components/tokens/TokensExplorer";
import { Loader2 } from "lucide-react";

export default function TokensPage() {
  return (
    <MainLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-selendra-500" />
        </div>
      }>
        <TokensExplorer />
      </Suspense>
    </MainLayout>
  );
}
