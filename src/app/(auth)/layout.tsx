import { BrandMark } from "@/components/ui/brand-mark";
import { ThemePicker } from "@/components/layout/appearance-menu";

// The hero's decorative rings are an ::after circle plus two box-shadow halos, all derived from --sky so they follow the theme.
const heroRings =
  "after:absolute after:-right-36 after:-top-32 after:size-[22rem] after:rounded-full after:border after:border-sky/35 after:shadow-[0_0_0_28px_color-mix(in_srgb,var(--sky)_5%,transparent),0_0_0_56px_color-mix(in_srgb,var(--sky)_3.5%,transparent)] after:content-['']";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="grid min-h-dvh items-center bg-background px-4 py-20 text-ink sm:px-6 lg:px-8">
      <div className="fixed right-4 top-4 z-20"><ThemePicker /></div>
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-md border border-outline bg-surface shadow-lg lg:min-h-[620px] lg:grid-cols-[1fr_1.05fr]">
        <aside className={`relative hidden overflow-hidden border-r border-outline bg-gradient-to-br from-surface to-background p-8 lg:flex lg:flex-col lg:justify-between xl:p-12 [&>*]:relative [&>*]:z-[1] ${heroRings}`}>
          <BrandMark />
          <div className="max-w-lg">
            <p className="eyebrow">Event operations workspace</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-ink">Make every event feel effortless.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">One focused workspace for registration, tickets, check-in, communications, and the people who make it happen.</p>
            {/* <div className="mt-8 grid grid-cols-3 gap-3 rounded-md border border-outline bg-background/75 p-4">
              <div><strong className="block text-xl text-ink">01</strong><span className="mt-1 block text-xs text-ink-muted">Plan</span></div>
              <div><strong className="block text-xl text-ink">02</strong><span className="mt-1 block text-xs text-ink-muted">Operate</span></div>
              <div><strong className="block text-xl text-ink">03</strong><span className="mt-1 block text-xs text-ink-muted">Deliver</span></div>
            </div> */}
          </div>
          <p className="text-xs text-ink-muted">Built for calm, clear event teams.</p>
        </aside>
        <section className="flex flex-col justify-center bg-surface p-6 sm:p-10 lg:p-12">
          <div className="mb-8 lg:hidden"><BrandMark /></div>
          <div className="mx-auto w-full max-w-md">{children}</div>
          <p className="mt-8 text-center text-xs text-ink-muted">Cikarang Dryport Event Management · Secure event operations.</p>
        </section>
      </div>
    </main>
  );
}
