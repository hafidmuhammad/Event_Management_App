import { Card } from "@/components/ui/card";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function ContactListsLoading() {
  return (
    <LoadingStatus label="Loading contact lists">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-7 w-52" />
            <Skeleton className="mt-2 h-4 w-80" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, card) => (
            <Card key={card} asChild>
              <article>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="mt-2 h-4 w-4/5" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
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
