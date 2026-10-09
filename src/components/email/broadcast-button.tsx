"use client";
import { ConfirmActionButton } from "@/components/events/confirm-action-button";
export function BroadcastButton({ count }: { count: number }) { return <ConfirmActionButton variant="primary" size="sm" disabled={!count} message={`Confirm broadcast to ${count} recipients using the reviewed transport?`}>Confirm broadcast</ConfirmActionButton>; }
