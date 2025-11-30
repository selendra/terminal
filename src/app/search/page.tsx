import { Suspense } from 'react';
import { SearchResults } from '@/components/explorer/SearchResults';

export const metadata = {
    title: 'Search Results | Selendra Terminal',
    description: 'Search for blocks, transactions, accounts, and tokens on Selendra blockchain',
};

export default function SearchPage({
    searchParams,
}: {
    searchParams: { q?: string };
}) {
    const query = searchParams.q || '';

    return (
        <div className="p-6 space-y-6">
            <Suspense fallback={<SearchResultsSkeleton />}>
                <SearchResults query={query} />
            </Suspense>
        </div>
    );
}

function SearchResultsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 w-64 bg-background-tertiary rounded" />
            <div className="h-4 w-48 bg-background-tertiary rounded" />
            <div className="grid gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-background-card border border-border rounded-xl p-6">
                        <div className="h-5 w-40 bg-background-tertiary rounded mb-3" />
                        <div className="h-4 w-full bg-background-tertiary rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
