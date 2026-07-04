import { TripIssueType } from "@prisma/client";
import { z } from "zod";

export const safetyChecklistSchema = z.object({
  fuelChecked: z.boolean(),
  tiresChecked: z.boolean(),
  brakesChecked: z.boolean(),
  lightsChecked: z.boolean(),
});

export const reportIssueSchema = z.object({
  issueType: z.nativeEnum(TripIssueType),
  issueDescription: z.string().optional(),
  issueLatitude: z.number().optional(),
  issueLongitude: z.number().optional(),
});

export type SafetyChecklistInput = z.infer<typeof safetyChecklistSchema>;
export type ReportIssueInput = z.infer<typeof reportIssueSchema>;