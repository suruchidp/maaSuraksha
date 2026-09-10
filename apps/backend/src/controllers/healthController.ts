import { Request, Response } from "express";

export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  res.json({
    status: "ok",
    service: "maasuraksha-backend",
    version: "1.0.0",
    uptime,
    timestamp,
    environment: process.env.NODE_ENV || "development",
  });
}
