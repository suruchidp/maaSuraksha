import { httpGet, httpPost } from "@/lib/api";
import { AuthResponse, UserDTO } from "@/lib/types";

export async function fetchCurrentUser(): Promise<UserDTO> {
  return httpGet<UserDTO>("/auth/me");
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return httpPost<AuthResponse>("/auth/login", { email, password });
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