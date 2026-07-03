import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes";
import testRoutes from "./modules/test/test.routes";
import userRoutes from "./modules/users/user.routes";
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", userRoutes);


app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "IndusConnect API is running successfully",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    service: "IndusConnect Backend",
  });
});

export default app;