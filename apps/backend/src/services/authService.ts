import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { generateToken } from "../utils/token";
import { UserRole, Language } from "@maasuraksha/shared";

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  language?: Language;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    language: Language;
  };
}

const PUBLIC_REGISTRATION_ROLES = new Set([
  UserRole.PATIENT,
  UserRole.ASHA,
  UserRole.DOCTOR,
]);

function toAuthResult(userId: string, user: {
  name: string;
  email: string;
  role: UserRole;
  language: Language;
}): AuthResult {
  const token = generateToken({ userId, role: user.role });
  return { token, user: { id: userId, ...user } };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (!PUBLIC_REGISTRATION_ROLES.has(input.role)) {
    throw ApiError.forbidden(
      "Admin accounts cannot be created through public registration"
    );
  }

  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = new User({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    phone: input.phone,
    language: input.language ?? Language.EN,
  });
  await user.save();

  return toAuthResult(user._id.toString(), {
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
  });
}

export async function registerWithRole(
  input: RegisterInput
): Promise<AuthResult> {
  if (!PUBLIC_REGISTRATION_ROLES.has(input.role)) {
    throw ApiError.forbidden(
      "Only PATIENT, ASHA and DOCTOR accounts can be created this way"
    );
  }
  return register(input);
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({
    email: input.email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("This account has been deactivated");
  }

  const valid = await user.comparePassword(input.password);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  return toAuthResult(user._id.toString(), {
    name: user.name,
    email: user.email,
    role: user.role,
    language: user.language,
  });
}

export async function getProfile(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    language: user.language,
    isActive: user.isActive,
    assignedASHA: user.assignedASHA,
    assignedDoctor: user.assignedDoctor,
    createdAt: user.createdAt,
  };
}