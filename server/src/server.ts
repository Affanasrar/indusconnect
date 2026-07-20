import dotenv from "dotenv";
import app from "./app";
import { generateDailyBookingsFromSubscriptions } from "./modules/shuttle-bookings/shuttleBooking.service";

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
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