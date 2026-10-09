import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function CommitteeDisplayLoading() {
  return (
    <LoadingStatus>
      <main className="min-h-screen bg-surface-sunken px-6 py-12 text-center text-ink">
        <Skeleton className="mx-auto h-3 w-24" />
        <Skeleton className="mx-auto mt-4 h-10 w-80 max-w-full" />
        <Skeleton className="mx-auto mt-3 h-4 w-56 max-w-full" />
        <div className="mx-auto mt-12 max-w-3xl space-y-8">
          {Array.from({ length: 4 }).map((_, index) => <div key={index}><Skeleton className="mx-auto h-5 w-48" /><Skeleton className="mx-auto mt-2 h-4 w-32" /></div>)}
        </div>
      </main>
    </LoadingStatus>
  );
}
