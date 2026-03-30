import { z } from 'zod'
import { mergeTripIntake } from '../call-store'

const updateTripIntakeSchema = z.object({
  customerName: z
    .string()
    .optional()
    .describe("Customer's preferred name once they give it."),
  tripRequirementsNotes: z
    .string()
    .optional()
    .describe(
      'Running summary of trip needs: destination, travel window, party size, must-haves, budget hints, etc. Merge new facts into one clear paragraph.'
    ),
})

/** JSON Schema for OpenAI Realtime function `parameters` (kept in sync with Zod schema). */
export const updateTripIntakeParametersJsonSchema = {
  type: 'object',
  properties: {
    customerName: {
      type: 'string',
      description: "Customer's preferred name once they give it.",
    },
    tripRequirementsNotes: {
      type: 'string',
      description:
        'Running summary of trip needs: destination, travel window, party size, must-haves, budget hints, etc.',
    },
  },
  additionalProperties: false,
} as const

export const updateTripIntakeTool = {
  name: 'update_trip_intake',
  description:
    'Call when you learn or update the customer’s name or trip requirements during intake. Pass only fields that changed; they are merged for handoff to a human agent. Speak a short acknowledgment before calling this tool when the customer just spoke.',
  parameters: updateTripIntakeSchema,
  parametersJsonSchema: updateTripIntakeParametersJsonSchema,
  execute: async (callId: string, args: unknown): Promise<void> => {
    const parsed = updateTripIntakeSchema.parse(args ?? {})
    mergeTripIntake(callId, parsed)
  },
}
