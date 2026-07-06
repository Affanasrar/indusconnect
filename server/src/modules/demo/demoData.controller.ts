import { Request, Response } from "express";
import {
  getDemoChecklist,
  getDemoSummary,
  seedDemoData,
} from "./demoData.service";

export async function seedDemoDataController(_req: Request, res: Response) {
  try {
    const result = await seedDemoData();

    return res.status(201).json({
      success: true,
      message: "Demo data seeded successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to seed demo data",
    });
  }
}

export async function getDemoSummaryController(_req: Request, res: Response) {
  try {
    const summary = await getDemoSummary();

    return res.status(200).json({
      success: true,
      message: "Demo summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch demo summary",
    });
  }
}

export async function getDemoChecklistController(_req: Request, res: Response) {
  try {
    const checklist = await getDemoChecklist();

    return res.status(200).json({
      success: true,
      message: "Demo checklist fetched successfully",
      data: checklist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch demo checklist",
    });
  }
}