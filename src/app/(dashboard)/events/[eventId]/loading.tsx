"use client";

import { usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LoadingStatus, Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
  const pathname = usePathname();
  const table = /\/(tickets|participants)(\/|$)/.test(pathname);
  const settings = /\/(settings|edit)(\/|$)/.test(pathname);
  const committee = /\/committee(\/|$)/.test(pathname);
  const email = /\/email(\/|$)/.test(pathname);
  const checkin = /\/check-in(\/|$)/.test(pathname);
  const studio = /\/(doorprize|awards)(\/|$)/.test(pathname);
  return (
    <LoadingStatus>
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Skeleton className="h-3 w-36" />
              <Skeleton className="mt-2 h-7 w-72 max-w-[80vw]" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
            <div className="flex gap-2"><Skeleton className="h-ctl-md w-20" /><Skeleton className="h-ctl-md w-20" /></div>
          </div>
          {!table && !settings && !committee && !email && !checkin && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: studio ? 3 : 4 }).map((_, index) => <Card key={index} className="gap-0"><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-6 w-12" /></Card>)}</div>}
          {table ? <Card className="gap-3 bg-transparent"><div className="flex gap-3"><Skeleton className="h-ctl-md flex-1" /><Skeleton className="h-ctl-md w-32" /></div>{Array.from({ length: 5 }).map((_, index) => <div key={index} className="grid grid-cols-2 gap-3 border-t border-outline py-3 sm:grid-cols-5">{Array.from({ length: 5 }).map((_, cell) => <Skeleton key={cell} className="h-5 w-full" />)}</div>)}</Card>
          : checkin ? <Card className="gap-0 bg-transparent"><div className="flex gap-3 border-b border-outline pb-3"><Skeleton className="h-ctl-md w-32" /><Skeleton className="h-ctl-md w-32" /></div><Skeleton className="mt-4 h-ctl-md w-full" /><Skeleton className="mt-4 h-28 w-full" /><Skeleton className="mt-4 h-6 w-40" /></Card>
          : settings || committee ? <Card className="gap-4 bg-transparent">{Array.from({ length: committee ? 4 : 3 }).map((_, index) => <div key={index} className="grid gap-3 sm:grid-cols-2"><div><Skeleton className="mb-2 h-3 w-24" /><Skeleton className="h-ctl-md w-full" /></div><div><Skeleton className="mb-2 h-3 w-24" /><Skeleton className="h-ctl-md w-full" /></div></div>)}<Skeleton className="ml-auto h-ctl-md w-32" /></Card>
          : email || studio ? <div className="grid gap-4 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="gap-3 bg-transparent"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-40" /><div className="flex gap-2"><Skeleton className="h-ctl-md w-24" /><Skeleton className="h-ctl-md w-24" /></div></Card>)}</div>
          : <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="gap-0"><Skeleton className="h-4 w-32" /><div className="mt-5 space-y-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="grid grid-cols-[110px_1fr] gap-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-full" /></div>)}</div></Card>
            <Card className="gap-0"><Skeleton className="h-4 w-24" /><div className="mt-4 space-y-2">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="rounded-md border border-outline p-2.5"><Skeleton className="h-4 w-36" /><Skeleton className="mt-2 h-4 w-24" /></div>)}</div></Card>
          </div>}
        </section>
      </div>
    </LoadingStatus>
  );
}
