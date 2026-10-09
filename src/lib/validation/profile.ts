import { z } from "zod";

/** Display name: inner whitespace is collapsed, then 2 to 160 characters (the column is varchar(160)). */
export const profileSchema = z.object({
  name: z
    .string({ error: "Enter your name." })
    .transform((value) => value.replace(/\s+/g, " ").trim())
    .pipe(z.string().min(2, "Name must be at least 2 characters.").max(160, "Name must be 160 characters or fewer.")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
