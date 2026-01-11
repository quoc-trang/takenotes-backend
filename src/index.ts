import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import noteRoutes from "./routes/notes";
import uploadRoutes from "./routes/upload";
import { errorHandler } from "./middleware/errorHandler";
import logger from "./utils/logger";
import { authenticateToken } from "./middleware/auth";

dotenv.config(); // loads environment variables from .env file

const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet()); // protects from well-known web vulnerabilities
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json()); // parses JSON payloads from incoming requests into object

app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

app.get("/hc", (req, res) => {
  logger.info("Health check requested");
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);

app.use(authenticateToken);
app.use("/api/notes", noteRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

app.listen(Number(PORT), "0.0.0.0", () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
});
