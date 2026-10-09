import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function RegistrationLoading() {
  return (
    <LoadingStatus>
      <main className="mx-auto max-w-2xl px-5 py-10 md:py-16">
        <section className="rounded-md border border-outline bg-surface p-5 md:p-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-8 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <div className="mt-8 space-y-5">
            {Array.from({ length: 4 }).map((_, index) => <div key={index}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-9 w-full" /></div>)}
          </div>
          <Skeleton className="mt-6 h-9 w-32" />
        </section>
      </main>
    </LoadingStatus>
  );
}
