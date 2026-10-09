import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function ContactListDetailLoading() {
  return (
    <LoadingStatus label="Loading contacts">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-7 w-64" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="size-8" />
          </div>
        </div>
        <div className="overflow-hidden rounded-md border border-outline bg-surface">
          <div className="grid grid-cols-2 gap-4 border-b border-outline px-3 py-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-3 w-full" />)}
          </div>
          {Array.from({ length: 6 }).map((_, row) => (
            <div key={row} className="grid grid-cols-2 gap-4 border-b border-outline-soft px-3 py-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, column) => <Skeleton key={column} className={`h-4 ${column === 0 ? "w-4/5" : "w-full"}`} />)}
            </div>
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}
