import dotenv from "dotenv";

dotenv.config();

export default {
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  jwtExpiration: "24h",
};
