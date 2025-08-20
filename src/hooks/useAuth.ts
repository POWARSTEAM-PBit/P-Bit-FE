import { useState } from "react";
import { ApiResp } from "../api/int";
import client from "../api/client";

export interface LoginInput {
  user_id: string;
  password: string;
  user_type: "student" | "teacher";
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  password: string;
  user_id: string;
  user_type: "student" | "teacher";
}

export interface LoginData {
  access_token: string;
  token_type: string;
}

type LoginResponse = ApiResp<LoginData>;
type RegisterResponse = ApiResp<null>;

export function useAuth() {
  const [user, setKey] = useState<string | null>(() => {
    return localStorage.getItem("auth_token");
  });

  const login = async (data: LoginInput): Promise<LoginResponse> => {
    try {
      const params = new URLSearchParams();
      params.append("username", data.user_id); // must be "username" for OAuth2PasswordRequestForm
      params.append("password", data.password);

      const response = await client.post<LoginResponse>(
        "/user/login",
        params,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const res = response.data;

      if (res.success && res.data?.access_token) {
        localStorage.setItem("auth_token", res.data.access_token);
        setKey(res.data.access_token);
        console.log("Token saved:", res.data.access_token);
      }

      return res;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Unknown error occurred";
      return { success: false, message } as LoginResponse;
    }
  };

  const register = async (data: RegisterInput): Promise<RegisterResponse> => {
    try {
      const response = await client.post<RegisterResponse>("/user/register", data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Unknown error occurred";
      return { success: false, message } as RegisterResponse;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setKey(null);
  };

  const isLoggedIn = user !== null;

  return { user, isLoggedIn, login, register, logout };
}
