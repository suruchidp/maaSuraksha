import { User } from "@maasuraksha/shared";
import { UserDTO } from "@/lib/types";

export function dtoToUser(dto: UserDTO): User {
  return {
    _id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    language: dto.language,
    phone: dto.phone,
    assignedASHA: dto.assignedASHA,
    assignedDoctor: dto.assignedDoctor,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function formatRiskScore(score?: number): string {
  if (score === undefined || score === null) return "—";
  return `${Math.round(score * 100)}%`;
}