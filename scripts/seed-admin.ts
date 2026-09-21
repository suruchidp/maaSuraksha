/**
 * DEVELOPMENT-ONLY admin seed script.
 *
 * Creates a single development ADMIN account directly in MongoDB. It is meant
 * to be run from your machine against a local/dev database and MUST NEVER be
 * mounted as an HTTP endpoint or exposed to public registration.
 *
 * - Connects using MONGODB_URI (root .env / backend .env / process env).
 * - Reuses the existing User model and its bcrypt pre-save hook, so the admin
 *   password is hashed exactly like normal user registration.
 * - Sets role=ADMIN and isActive=true.
 * - Refuses to create a second ADMIN if one already exists.
 * - Never prints the password.
 *
 * Usage (environment variables):
 *   ADMIN_SEED_NAME="Dev Admin" \
 *   ADMIN_SEED_EMAIL=admin@example.com \
 *   ADMIN_SEED_PASSWORD='<secret>' \
 *   npm run seed:admin
 *
 * Usage (command-line flags):
 *   npm run seed:admin -- --name "Dev Admin" --email admin@example.com --password '<secret>'
 *
 * The email/password are always required; the name defaults to "Development
 * Admin". Passwords must satisfy the same policy as public registration
 * (>= 8 chars, upper + lower + digit).
 */
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { registerSchema, UserRole, Language } from "@maasuraksha/shared";
import { config } from "../apps/backend/src/config";
import { User } from "../apps/backend/src/models/User";

dotenv.config({ path: path.resolve(__dirname, "../apps/backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export interface AdminSeedInput {
  name: string;
  email: string;
  password: string;
}

export interface AdminSeedResult {
  created: boolean;
  name: string;
  email: string;
  role: UserRole;
  skippedBecause?: "ADMIN_EXISTS";
}

/**
 * Seeds one development ADMIN. Returns { created, ... } instead of throwing
 * when an ADMIN already exists, so callers can decide how to handle it.
 */
export async function seedAdmin(
  input: AdminSeedInput
): Promise<AdminSeedResult> {
  const { name, email, password } = registerSchema
    .omit({ role: true })
    .parse(input);

  const existing = await User.findOne({ role: UserRole.ADMIN });
  if (existing) {
    return {
      created: false,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      skippedBecause: "ADMIN_EXISTS",
    };
  }

  const admin = new User({
    name,
    email,
    password,
    role: UserRole.ADMIN,
    isActive: true,
    language: Language.EN,
  });
  await admin.save();

  return {
    created: true,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

interface CliOptions {
  name?: string;
  email?: string;
  password?: string;
}

const USAGE = `Usage:
  ADMIN_SEED_NAME="Dev Admin" ADMIN_SEED_EMAIL=<email> ADMIN_SEED_PASSWORD='<secret>' npm run seed:admin
  npm run seed:admin -- --name "Dev Admin" --email <email> --password '<secret>'

Flags take precedence over the ADMIN_SEED_* environment variables. The email
and password are always required; the name defaults to "Development Admin".
The password is never printed and must satisfy the public registration policy
(>= 8 chars, upper + lower + digit).`;

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (!match) continue;
    const [, key = "", inline] = match;
    let value = inline;
    if (value === undefined && i + 1 < argv.length) {
      i++;
      value = argv[i]!;
    }
    if (key === "name") opts.name = value;
    else if (key === "email") opts.email = value;
    else if (key === "password") opts.password = value;
  }
  return opts;
}

async function main(): Promise<number> {
  if (process.argv.slice(2).includes("--help") || process.argv.slice(2).includes("-h")) {
    console.log(USAGE);
    return 0;
  }

  if (config.nodeEnv === "production") {
    console.error(
      "Refusing to run: this seed script is development-only and must not be used against a production database."
    );
    return 1;
  }

  const cli = parseArgs(process.argv.slice(2));
  const name = cli.name ?? process.env.ADMIN_SEED_NAME ?? "Development Admin";
  const email = cli.email ?? process.env.ADMIN_SEED_EMAIL;
  const password = cli.password ?? process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN email and password are required.\n");
    console.log(USAGE);
    return 1;
  }

  const mongodbUri = process.env.MONGODB_URI || config.mongodbUri;

  try {
    await mongoose.connect(mongodbUri);
    console.log(
      `Connected to MongoDB at ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (error) {
    console.error("Failed to connect to MongoDB:", (error as Error).message);
    return 1;
  }

  try {
    const result = await seedAdmin({ name, email, password });

    if (result.created) {
      console.log("Created development ADMIN account:");
      console.log(`  name : ${result.name}`);
      console.log(`  email: ${result.email}`);
      console.log(`  role : ${result.role}`);
      // The password is hashed by the User model and is never printed here.
      console.log("Password hash uses the same bcrypt path as normal registration.");
      return 0;
    }

    console.error(
      `Refused to create a duplicate ADMIN. An ADMIN account already exists ` +
        `(name: ${result.name}, email: ${result.email}). No changes were made.`
    );
    return 1;
  } catch (error) {
    if (error instanceof Error && "issues" in error) {
      const issues = (error as { issues: { path: (string | number)[]; message: string }[] }).issues
        .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
        .join("; ");
      console.error("Invalid admin credentials:", issues);
    } else if (
      error instanceof Error &&
      (error as { code?: number } & Error).code === 11000
    ) {
      console.error(
        "Refused to create the ADMIN: that email is already in use by another account."
      );
    } else {
      console.error("Failed to seed ADMIN:", (error as Error).message);
    }
    return 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      console.error("Unexpected error:", error);
      process.exitCode = 1;
    });
}