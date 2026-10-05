import "dotenv/config";
import app from "./app";
import prisma from "./config/prisma";
import { generateDailyBookingsFromSubscriptions } from "./modules/shuttle-bookings/shuttleBooking.service";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`IndusConnect backend running on port ${PORT}`);

  // Auto-bookings scheduler checks hourly to run once a day
  let lastCheckedDate = "";
  setInterval(async () => {
    try {
      const now = new Date();
      const currentDateString = now.toDateString();
      if (lastCheckedDate !== currentDateString) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const count = await generateDailyBookingsFromSubscriptions(tomorrow);
        console.log(`[Scheduler] Generated ${count} bookings for tomorrow ${tomorrow.toLocaleDateString()}`);
        lastCheckedDate = currentDateString;
      }
    } catch (err) {
      console.error("[Scheduler Error]:", err);
    }
  }, 1000 * 60 * 60);
});

// Graceful shutdown handling for Render and container lifecycle
const gracefulShutdown = async (signal: string) => {
  console.log(`[Process] Received ${signal}. Gracefully terminating server...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log("[Prisma] Database connection closed.");
      process.exit(0);
    } catch (err) {
      console.error("[Prisma Error] Error disconnecting database:", err);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

export default server;