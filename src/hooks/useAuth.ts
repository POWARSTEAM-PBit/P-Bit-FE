import { useState } from "react";
import { login as loginApi } from "../api/auth";

interface User {
  email?: string;    // only teacher has email
  username?: string; // only student has username
  role: "student" | "teacher";
}

interface StudentLoginInput {
  username: string;
  password: string;
  user_type: "student";
}

interface TeacherLoginInput {
  email: string;
  password: string;
  user_type: "teacher";
}

type LoginInput = StudentLoginInput | TeacherLoginInput;

interface LoginResponse {
  token: string;
  user: User;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = async (data: LoginInput): Promise<LoginResponse> => {
    const res = await loginApi(data);
    setUser(res.user);
    return res;
  };

  return { user, login };
}