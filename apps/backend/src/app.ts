import healthRecordRoutes from "./routes/healthRecords";
import { seedEducationResources } from "./services/educationContent";
import { EducationProgress } from "./models/EducationProgress";
import { startAlertWorker } from "./services/alertWorker";
import { Alert } from "./models/Alert";
import { ChatTurn } from './models/ChatTurn';
import { Referral } from './models/Referral';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { connectDB } from "./config/database";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import healthRoutes from "./routes/health";
import authRoutes from "./routes/auth";
import pregnancyRoutes from "./routes/pregnancy";
import healthMetricRoutes from "./routes/healthMetrics";
import symptomRoutes from "./routes/symptoms";
import assessmentRoutes from "./routes/assessments";
import moodRoutes from "./routes/mood";
import recommendationRoutes from "./routes/recommendations";
import dietPlanRoutes from "./routes/dietPlans";
import dietGuidanceRoutes from "./routes/dietGuidance";
import alertRoutes from "./routes/alerts";
import referralRoutes from "./routes/referrals";
import appointmentRoutes from "./routes/appointments";
import educationRoutes from "./routes/education";
import chatRoutes from "./routes/chat";
import reportRoutes from "./routes/reports";
import adminRoutes from "./routes/admin";
import patientRoutes from "./routes/patients";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));

const isTest = process.env.NODE_ENV === "test";

if (!isTest) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later" },
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: "Too many authentication attempts, please try again later" },
  });
  app.use("/api", limiter);
  app.use("/api/v1/auth", authLimiter);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/pregnancy", pregnancyRoutes);
app.use("/api/v1/health-metrics", healthMetricRoutes);
app.use("/api/v1/symptoms", symptomRoutes);
app.use("/api/v1/assessments", assessmentRoutes);
app.use("/api/v1/mood", moodRoutes);
app.use("/api/v1/recommendations", recommendationRoutes);
app.use("/api/v1/diet-plans", dietPlanRoutes);
app.use("/api/v1/diet-guidance", dietGuidanceRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/referrals", referralRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/education", educationRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/health-records", healthRecordRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/patients", patientRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "MaaSuraksha API",
    version: "1.0.0",
    docs: "/api/v1/health",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

async function startServer(): Promise<import("http").Server> {
  try {
    await connectDB();
    await Alert.init();
    await Promise.all([ChatTurn.init(), Referral.init()]);
    await EducationProgress.init();
    await seedEducationResources();
    const server = app.listen(config.port, () => {
      console.log(
        `MaaSuraksha backend running on port ${config.port} in ${config.nodeEnv} mode`
      );
    });
    const stopAlerts = startAlertWorker();
    server.on("close", stopAlerts);
    return server;
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
