import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// import mongoSanitize from "express-mongo-sanitize";
// import xss from "xss-clean";
// import hpp from "hpp";
import path from "path";
import { fileURLToPath } from "url";
// import { init as initSocket } from "./socket.js";

// Route files
import authRoutes from "./routes/auth.routes.js";
import hospitalRoutes from "./routes/hospital.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import donationRouter from "./routes/donation.routes.js";
import requestRouter from "./routes/request.routes.js";

// Error handler
import errorHandler from "./middlewares/error.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize socket.io
// initSocket(app);

// Body parser
app.use(express.json());

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Set security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// Sanitize data
// app.use(mongoSanitize());

// Prevent XSS attacks
// app.use(xss());

// Prevent http param pollution
// app.use(hpp());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/hospitals", hospitalRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/feedback", feedbackRoutes);
app.use("/api/v1/request", requestRouter);
app.use("/api/v1/donation", donationRouter);

// Error handler middleware
app.use(errorHandler);

export default app;
