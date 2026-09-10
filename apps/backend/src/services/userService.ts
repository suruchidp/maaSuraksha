import { User } from "../models/User";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { UserRole, Language } from "@maasuraksha/shared";

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  language?: Language;
}

export interface AdminUserUpdateInput {
  role?: UserRole;
  isActive?: boolean;
  assignedASHA?: string | null;
  assignedDoctor?: string | null;
}

export async function updateOwnProfile(
  userId: string,
  input: UpdateUserInput
) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  user.name = input.name ?? user.name;
  if (input.phone !== undefined) user.phone = input.phone;
  if (input.language !== undefined) user.language = input.language;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    language: user.language,
  };
}

export async function listUsers(
  adminRole: UserRole,
  options: { page: number; limit: number; role?: string }
) {
  if (adminRole !== UserRole.ADMIN) {
    throw ApiError.forbidden();
  }

  const filter: Record<string, unknown> = {};
  if (options.role) filter.role = options.role;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort({ createdAt: -1 });

  return {
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      language: u.language,
      isActive: u.isActive,
      assignedASHA: u.assignedASHA,
      assignedDoctor: u.assignedDoctor,
      createdAt: u.createdAt,
    })),
    total,
  };
}

export async function updateUserByAdmin(
  adminRole: UserRole,
  targetUserId: string,
  input: AdminUserUpdateInput
) {
  if (adminRole !== UserRole.ADMIN) {
    throw ApiError.forbidden();
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (input.role !== undefined) user.role = input.role;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.assignedASHA !== undefined) {
    user.assignedASHA = input.assignedASHA
      ? new mongoose.Types.ObjectId(input.assignedASHA)
      : undefined;
  }
  if (input.assignedDoctor !== undefined) {
    user.assignedDoctor = input.assignedDoctor
      ? new mongoose.Types.ObjectId(input.assignedDoctor)
      : undefined;
  }
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    assignedASHA: user.assignedASHA,
    assignedDoctor: user.assignedDoctor,
  };
}

export async function listAccessiblePatients(
  requester: { role: UserRole; userId: string },
  options: { page: number; limit: number; search?: string }
) {
  if (requester.role === UserRole.PATIENT) {
    throw ApiError.forbidden();
  }

  const filter: Record<string, unknown> = { role: UserRole.PATIENT };
  if (requester.role === UserRole.ASHA) {
    filter.assignedASHA = requester.userId;
  } else if (requester.role === UserRole.DOCTOR) {
    filter.assignedDoctor = requester.userId;
  }

  if (options.search) {
    filter.$or = [
      { name: { $regex: options.search, $options: "i" } },
      { email: { $regex: options.search, $options: "i" } },
    ];
  }

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select("-password")
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort({ createdAt: -1 });

  return {
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      language: u.language,
      isActive: u.isActive,
      assignedASHA: u.assignedASHA,
      assignedDoctor: u.assignedDoctor,
      createdAt: u.createdAt,
    })),
    total,
  };
}

export async function createUserByAdmin(
  adminRole: UserRole,
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    language?: Language;
  }
) {
  if (adminRole !== UserRole.ADMIN) {
    throw ApiError.forbidden();
  }

  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    password: input.password,
    role: input.role,
    phone: input.phone,
    language: input.language ?? Language.EN,
  });

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}