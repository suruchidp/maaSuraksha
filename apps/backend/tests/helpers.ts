import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { app } from "../src/app";

let server: MongoMemoryServer | null = null;
let connected = false;

export async function connectTestDb() {
  if (connected) return;
  server = await MongoMemoryServer.create();
  await mongoose.connect(server.getUri(), { serverSelectionTimeoutMS: 10000 });
  connected = true;
  process.on("exit", () => {
    void server?.stop();
  });
}

export async function cleanDb() {
  if (!mongoose.connection.db) return;
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

export function api() {
  return request(app);
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  language?: string;
}

export async function registerAndGetToken(input: RegisterUserInput) {
  const res = await api()
    .post("/api/v1/auth/register")
    .send({ name: input.name, email: input.email, password: input.password, role: input.role });
  if (res.status !== 201) {
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.data.token as string;
}