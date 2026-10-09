import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { events, participants, type DoorprizeConfig, type DoorprizePrize } from "@/db/schema";
import { getDb, type Database } from "@/db";
import { doorprizePrizeSchema, doorprizeSchema, type DoorprizeConfigInput } from "@/lib/validation/phase5";
import { recordActivity } from "./activity";

const emptyDoorprize: DoorprizeConfig = { version: 1, settings: { eligibleStatus: "CHECKED_IN", allowMultipleWin: false }, prizes: [] };

function parseConfig(value: unknown): DoorprizeConfigInput { return doorprizeSchema.parse(value ?? emptyDoorprize); }
export async function getDoorprize(eventId: string, database: Database = getDb()) { const [event] = await database.select({ id: events.id, doorprizeJson: events.doorprizeJson }).from(events).where(eq(events.id, eventId)).limit(1); return event ? { ...event, doorprize: parseConfig(event.doorprizeJson) } : null; }
export async function saveDoorprize(eventId: string, input: unknown, database: Database = getDb()) { const parsed = parseConfig(input); await database.update(events).set({ doorprizeJson: parsed }).where(eq(events.id, eventId)); return parsed; }
export async function addPrize(eventId: string, input: unknown, database: Database = getDb()) { const prize = doorprizePrizeSchema.parse({ ...(input as Record<string, unknown>), id: crypto.randomUUID(), winners: [] }); const current = await getDoorprize(eventId, database); if (!current) return { ok: false as const, code: "EVENT_NOT_FOUND" }; const next = { ...current.doorprize, prizes: [...current.doorprize.prizes, prize] }; await saveDoorprize(eventId, next, database); return { ok: true as const, prize }; }
export async function updatePrize(eventId: string, prizeId: string, input: unknown, database: Database = getDb()) { const current = await getDoorprize(eventId, database); if (!current) return { ok: false as const, code: "EVENT_NOT_FOUND" }; const existing = current.doorprize.prizes.find((prize) => prize.id === prizeId); if (!existing) return { ok: false as const, code: "PRIZE_NOT_FOUND" }; const parsed = doorprizePrizeSchema.parse({ ...(input as Record<string, unknown>), id: prizeId, winners: existing.winners }); const next = { ...current.doorprize, prizes: current.doorprize.prizes.map((prize) => prize.id === prizeId ? parsed : prize) }; await saveDoorprize(eventId, next, database); return { ok: true as const, prize: parsed }; }
export async function deletePrize(eventId: string, prizeId: string, database: Database = getDb()) { const current = await getDoorprize(eventId, database); if (!current) return { ok: false as const, code: "EVENT_NOT_FOUND" }; const prize = current.doorprize.prizes.find((item) => item.id === prizeId); if (!prize) return { ok: false as const, code: "PRIZE_NOT_FOUND" }; if (prize.winners.length > 0) return { ok: false as const, code: "PRIZE_ALREADY_DRAWN" }; await saveDoorprize(eventId, { ...current.doorprize, prizes: current.doorprize.prizes.filter((item) => item.id !== prizeId) }, database); return { ok: true as const }; }

export async function drawPrize(eventId: string, prizeId: string, database: Database = getDb()) {
  return database.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update").limit(1);
    if (!event) return { ok: false as const, code: "EVENT_NOT_FOUND" };
    const config = parseConfig(event.doorprizeJson);
    const prize = config.prizes.find((item) => item.id === prizeId);
    if (!prize) return { ok: false as const, code: "PRIZE_NOT_FOUND" };
    if (prize.winners.length >= prize.quantity) return { ok: false as const, code: "PRIZE_COMPLETE" };
    const allWinners = new Set(config.prizes.flatMap((item) => item.winners.map((winner) => winner.participantId)));
    const eligibleRows = await tx.select().from(participants).where(and(eq(participants.eventId, eventId), eq(participants.status, "CHECKED_IN")));
    const eligible = config.settings.allowMultipleWin ? eligibleRows : eligibleRows.filter((participant) => !allWinners.has(participant.id));
    if (!eligible.length) return { ok: false as const, code: "NO_ELIGIBLE_PARTICIPANT" };
    const participant = eligible[randomInt(0, eligible.length)];
    const winner = { participantId: participant.id, drawnAt: new Date().toISOString() };
    const nextPrize: DoorprizePrize = { ...prize, winners: [...prize.winners, winner] };
    const next = { ...config, prizes: config.prizes.map((item) => item.id === prizeId ? nextPrize : item) };
    await tx.update(events).set({ doorprizeJson: next }).where(eq(events.id, eventId));
    await recordActivity(eventId, "WINNER_DRAWN", `Winner selected for ${prize.name}: ${participant.name}.`, null, tx);
    return { ok: true as const, winner, participant, complete: nextPrize.winners.length >= nextPrize.quantity };
  });
}

export async function removeWinner(eventId: string, prizeId: string, participantId: string, database: Database = getDb()) {
  return database.transaction(async (tx) => {
    const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update").limit(1);
    if (!event) return { ok: false as const, code: "EVENT_NOT_FOUND" };
    const config = parseConfig(event.doorprizeJson);
    const prize = config.prizes.find((item) => item.id === prizeId);
    if (!prize) return { ok: false as const, code: "PRIZE_NOT_FOUND" };
    if (!prize.winners.some((winner) => winner.participantId === participantId)) return { ok: false as const, code: "WINNER_NOT_FOUND" };
    const next = { ...config, prizes: config.prizes.map((item) => item.id === prizeId ? { ...item, winners: item.winners.filter((winner) => winner.participantId !== participantId) } : item) };
    await tx.update(events).set({ doorprizeJson: next }).where(eq(events.id, eventId));
    await recordActivity(eventId, "WINNER_REMOVED", `Winner removed from ${prize.name}.`, null, tx);
    return { ok: true as const };
  });
}

export async function listWinnerParticipants(eventId: string, config: DoorprizeConfigInput, database: Database = getDb()) {
  const ids = config.prizes.flatMap((prize) => prize.winners.map((winner) => winner.participantId));
  if (!ids.length) return new Map<string, typeof participants.$inferSelect>();
  const rows = await database.select().from(participants).where(and(eq(participants.eventId, eventId), inArray(participants.id, ids)));
  return new Map(rows.map((participant) => [participant.id, participant]));
}

export async function getDoorprizeEligibleCount(eventId: string, config: DoorprizeConfigInput, database: Database = getDb()) {
  const [row] = await database.select({ count: sql<number>`count(*)` }).from(participants).where(candidateFilter(eventId, config));
  return Number(row?.count ?? 0);
}

function candidateFilter(eventId: string, config: DoorprizeConfigInput) {
  const winners = config.prizes.flatMap((prize) => prize.winners.map((winner) => winner.participantId));
  return and(eq(participants.eventId, eventId), eq(participants.status, "CHECKED_IN"), !config.settings.allowMultipleWin && winners.length ? notInArray(participants.id, winners) : undefined);
}
export async function getDoorprizeCandidates(eventId: string, config: DoorprizeConfigInput, database: Database = getDb()) {
  return database.select({ id: participants.id, name: participants.name, company: participants.company }).from(participants).where(candidateFilter(eventId, config)).limit(100);
}
