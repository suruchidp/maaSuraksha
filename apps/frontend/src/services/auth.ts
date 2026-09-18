import { httpGet, httpPost } from "@/lib/api";
import { AuthResponse, UserDTO } from "@/lib/types";

export async function fetchCurrentUser(): Promise<UserDTO> {
  return httpGet<UserDTO>("/auth/me", undefined, { timeout: 10000 });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return httpPost<AuthResponse>("/auth/login", { email, password }, { timeout: 10000 });
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
  language?: string;
}): Promise<AuthResponse> {
  return httpPost<AuthResponse>("/auth/register", input);
}
