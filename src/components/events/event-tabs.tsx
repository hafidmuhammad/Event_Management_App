"use client";

import { usePathname } from "next/navigation";
import { TabLink, TabsNav } from "@/components/ui/tabs";

const tabs = [
  { key: "overview", label: "Overview", suffix: "" },
  { key: "participants", label: "Participants", suffix: "/participants" },
  { key: "tickets", label: "Tickets", suffix: "/tickets" },
  { key: "check-in", label: "Check-in", suffix: "/check-in" },
  { key: "email", label: "Email", suffix: "/email" },
  { key: "doorprize", label: "Doorprize", suffix: "/doorprize" },
  { key: "awards", label: "Awards", suffix: "/awards" },
  { key: "committee", label: "Committee", suffix: "/committee" },
  { key: "settings", label: "Settings", suffix: "/settings" },
] as const;

export function EventTabs({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const base = `/events/${eventId}`;
  return (
    <TabsNav label="Event sections" listClassName="grid grid-cols-3 sm:flex sm:flex-wrap">
      {tabs.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const active = tab.key === "overview" ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);
        return <TabLink key={tab.key} href={href} active={active}>{tab.label}</TabLink>;
      })}
    </TabsNav>
  );
}
