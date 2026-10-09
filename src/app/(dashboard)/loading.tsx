import { Card } from "@/components/ui/card";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <LoadingStatus>
      <div className="space-y-section">
        <Card asChild className="gap-0 p-5">
          <section>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-7 w-2/3 max-w-xl" />
            <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
            <Skeleton className="mt-2 h-4 w-4/5 max-w-xl" />
            <Skeleton className="mt-5 h-8 w-32" />
          </section>
        </Card>
        <section>
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-2 h-6 w-56" />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} asChild className="gap-0">
                <article>
                  <Skeleton className="size-7" />
                  <Skeleton className="mt-4 h-4 w-24" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                </article>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </LoadingStatus>
  );
}
