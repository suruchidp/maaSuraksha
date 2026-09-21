import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const nodeEnv = process.env.NODE_ENV || "development";

/* A signing key that is public (or unset) lets anyone forge valid admin or
   patient bearer tokens against this API. Avoid failing open in production:
   refuse to start until an operator supplies a strong JWT_SECRET. Dev and
   test environments keep their local default. */
const PLACEHOLDER_JWT_SECRETS = new Set([
  "dev-secret-change-in-production",
  "change_this_to_a_secure_random_string",
  "change_this_to_a_secure_random_string_in_production",
  "your_jwt_secret_here_change_in_production",
]);
if (nodeEnv === "production") {
  const secret = process.env.JWT_SECRET;
  if (!secret || PLACEHOLDER_JWT_SECRETS.has(secret)) {
    throw new Error(
      "Refusing to start in production: JWT_SECRET must be set to a strong random value (see .env.example)."
    );
  }
}

export const config = {
  nodeEnv,
  port: parseInt(process.env.PORT || "5000", 10),
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/maasuraksha",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mlServiceUrl: process.env.ML_SERVICE_URL || "http://localhost:8000",
};
