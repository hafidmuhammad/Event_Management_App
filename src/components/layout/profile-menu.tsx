"use client";

import Link from "next/link";
import { ChevronDown, Settings, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogoutMenuItem } from "./logout-button";

/**
 * Profile avatar in the top bar. Clicking it opens a small menu with the signed
 * in user, a link to the Settings page (profile and appearance), and Log out.
 * The avatar is a fixed-size button, so opening the menu never moves anything around it.
 */
export function ProfileMenu({ name, role }: { name?: string | null; role: string }) {
  const initial = name?.trim().charAt(0).toUpperCase() ?? "";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Profile menu for ${name ?? "your account"}`}
          title="Profile"
          className="group inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-outline bg-surface-sunken py-0.5 pl-0.5 pr-2 text-ink-muted transition-colors hover:border-outline-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/60 data-[state=open]:border-sky"
        >
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary text-body font-semibold text-primary-fg">
            {initial || <User className="size-4" />}
          </span>
          <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label="Profile">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="block truncate text-body font-medium text-ink">{name ?? "Signed in"}</span>
          <span className="block truncate text-xs font-normal text-ink-muted">{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings aria-hidden="true" />Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <LogoutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}