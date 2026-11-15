import { z } from 'zod';

export const ErrorEnvelopeSchema = z.object({
  error: z.string(),
  message: z.string(),
  traceId: z.string().optional(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

export function jsonError(error: string, message: string, traceId: string, fieldErrors?: Record<string, string>) {
  return Response.json({ error, message, traceId, fieldErrors }, { status: 400 });
}
