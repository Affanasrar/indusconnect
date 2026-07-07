import { http } from "./http";
import type { ApiResponse, RoleName, UserProfile } from "../types/frontend";

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: RoleName;
  employeeCode?: string;
  department?: string;
  hrGrade?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: RoleName;
  employeeCode?: string;
  department?: string;
  hrGrade?: string;
  status?: string;
}

export async function getUsers() {
  const response = await http.get<ApiResponse<UserProfile[]>>("/users");
  return response.data.data;
}

export async function createUser(data: CreateUserInput) {
  const response = await http.post<ApiResponse<UserProfile>>("/users", data);
  return response.data.data;
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const response = await http.patch<ApiResponse<UserProfile>>(
    `/users/${id}`,
    data
  );

  return response.data.data;
}