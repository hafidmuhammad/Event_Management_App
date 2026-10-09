import { Card } from "@/components/ui/card";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function EventsLoading() {
  return (
    <LoadingStatus>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-7 w-28" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <Skeleton className="h-ctl-md w-28" />
        </div>
        <Card className="flex-row flex-wrap items-center gap-2">
          <Skeleton className="h-ctl-md min-w-[220px] flex-1" />
          <Skeleton className="h-ctl-md w-32" />
          <Skeleton className="h-ctl-md w-20" />
        </Card>
        <div className="overflow-hidden rounded-md border border-outline bg-surface">
          <div className="grid grid-cols-2 gap-4 border-b border-outline px-3 py-3 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-3 w-full" />)}
          </div>
          {Array.from({ length: 5 }).map((_, row) => (
            <div key={row} className="grid grid-cols-2 gap-4 border-b border-outline-soft px-3 py-4 md:grid-cols-7">
              {Array.from({ length: 7 }).map((_, column) => <Skeleton key={column} className={`h-4 ${column === 0 ? "w-4/5" : "w-full"}`} />)}
            </div>
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}
