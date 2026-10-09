import { z } from "zod";

const safeAsset = z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "Image must use a safe path or URL");
export const doorprizeWinnerSchema = z.object({ participantId: z.string().min(1).max(36), drawnAt: z.string().datetime({ offset: true }) });
export const doorprizePrizeSchema = z.object({ id: z.string().min(1).max(80), name: z.string().trim().min(1).max(160), category: z.string().trim().min(1).max(120).default("Doorprize"), quantity: z.number().int().min(1).max(100), image: safeAsset.optional(), winners: z.array(doorprizeWinnerSchema).max(100) });
export const doorprizeSchema = z.object({ version: z.literal(1), settings: z.object({ eligibleStatus: z.literal("CHECKED_IN"), allowMultipleWin: z.boolean().default(false) }), prizes: z.array(doorprizePrizeSchema).max(100) });
export const awardItemSchema = z.object({ id: z.string().min(1).max(80), name: z.string().trim().min(1).max(160), participantId: z.string().min(1).max(36).nullable(), recipientName: z.string().trim().min(1).max(200), subtitle: z.string().trim().max(200).optional(), image: safeAsset.optional(), displayOrder: z.number().int().min(1).max(1000) });
export const awardSchema = z.object({ version: z.literal(1), items: z.array(awardItemSchema).max(100) });
export type DoorprizeConfigInput = z.infer<typeof doorprizeSchema>;
export type AwardConfigInput = z.infer<typeof awardSchema>;
