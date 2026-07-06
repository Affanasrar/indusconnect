import { Router } from "express";
import prisma from "../../config/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      success: true,
      message: "IndusConnect backend is healthy",
      data: {
        service: "IndusConnect API",
        database: "connected",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Backend health check failed",
      data: {
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;