import client from "./client";

interface LoginData {
  user_id: string; // email or username based on user_type
  password: string;
  user_type: "student" | "teacher";
}

interface User {
  email?: string;   // for teachers
  username?: string; // for students
  name: string;
  role: "student" | "teacher";
}

interface LoginResponse {
  token: string;
  user: User;
}

export const login = async (data: LoginData): Promise<LoginResponse> => {
  const response = await client.post<LoginResponse>("/user/login", data);
  return response.data;
};
