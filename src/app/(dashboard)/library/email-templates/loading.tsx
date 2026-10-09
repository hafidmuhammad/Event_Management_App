import { Card } from "@/components/ui/card";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function GlobalEmailTemplatesLoading() {
  return (
    <LoadingStatus label="Loading global email templates">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-2 h-7 w-56" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-44" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, card) => (
            <Card key={card} asChild>
              <article>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="size-7" />
                </div>
              </article>
            </Card>
          ))}
        </div>
      </section>
    </LoadingStatus>
  );
}
