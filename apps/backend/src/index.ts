import { startServer } from "./app";
import mongoose from "mongoose";

let server: import("http").Server | undefined;

startServer()
  .then((s) => {
    server = s;
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("MongoDB connection closed");
    }
    console.log("Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));