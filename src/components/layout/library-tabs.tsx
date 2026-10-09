"use client";

import { usePathname } from "next/navigation";
import { TabLink, TabsNav } from "@/components/ui/tabs";

const tabs = [
  { key: "email-templates", label: "Email templates", href: "/library/email-templates" },
  { key: "contacts", label: "Contacts", href: "/library/contacts" },
] as const;

/** Section tabs for the shared Library menu (global templates + contact lists). */
export function LibraryTabs() {
  const pathname = usePathname();
  return (
    <TabsNav label="Library sections">
      {tabs.map((tab) => (
        <TabLink key={tab.key} href={tab.href} active={pathname === tab.href || pathname.startsWith(`${tab.href}/`)}>{tab.label}</TabLink>
      ))}
    </TabsNav>
  );
}
