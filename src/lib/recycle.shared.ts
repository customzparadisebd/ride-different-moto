// ============================================================
// RECYCLE BIN SHARED VALIDATION
// Purpose: One short, human-friendly confirmation token for every
//          permanent delete action (products, customers, orders).
// Status: COMPLETED
// Security: Server still re-checks role/permission; this only keeps
//          the typed confirmation short ("DELETE" or "CONFIRM").
// ============================================================
import { z } from "zod";

export const PURGE_CONFIRM_WORDS = ["DELETE", "CONFIRM"] as const;

/** Accepts a short confirmation word, case-insensitive: DELETE or CONFIRM. */
export const purgeConfirmToken = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .refine((value) => PURGE_CONFIRM_WORDS.includes(value.toUpperCase() as never), {
    message: 'Type "DELETE" to confirm permanent deletion.',
  });

export const recycleIdsInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export const recyclePurgeIdsInput = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  confirm: purgeConfirmToken,
});
