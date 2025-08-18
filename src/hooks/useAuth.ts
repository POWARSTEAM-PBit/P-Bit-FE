import { useState } from "react";
import { ApiResp } from "../api/int";
import client from "../api/client";
import { AxiosResponse } from "axios";

/**
 * @brief The following interface, describes a user type
 * The email or username can be set depending on the user role
 * And name is provided.
 */
export interface User {
  email?: string;
  username?: string;
  name: string;
  role: "student" | "teacher";
}

/**
 * @brief The interface relates to what data (payload) is
 * recieved from communicating with the backend API.
 */
export interface LoginData {
  api_key: string;
  user: User;
}

/**
 * @brief The following interface, refers
 * to the input provided by the user in the 
 * Login Forms.
 */
export interface LoginInput {
  user_id: string; //either username or email
  password: string;
  user_type: "student" | "teacher";
}

/**
 * @brief The following interface, refers
 * to the input provided by the user in the 
 * Register Forms.
 */
export interface RegisterInput {
  first_name: string;
  last_name: string;
  password: string;
  user_id: string; //either username or email
  user_type: "student" | "teacher";
}

type LoginResponse = ApiResp<LoginData>;
type RegisterResponse = ApiResp<null>;

/**
 * @brief Custom React hook to handle user authentication logic.
 * @returns Object containing user state, login status, and auth functions.
 */
export function useAuth() {
  const [user, setKey] = useState<string | null>(null);

  /**
   * @brief Logs a user in using their credentials.
   * @param data - LoginInput object containing user email and password.
   * @returns A promise resolving to LoginResponse, including user API key if successful.
   */
  const login = async (data: LoginInput): Promise<LoginResponse> => {
    try {
      const response = await client.post<LoginResponse>("/user/login", data);
      const res = response.data;

      if (res.success && res.data?.api_key) {
        setKey(res.data.api_key);
      }

      return res;
    } catch (error: any) {
      
      const message = error.response?.data?.message || error.message || "Unknown error occurred";

      return {success: false, message} as LoginResponse;
    }
};


  /**
   * @brief Registers a new user using the provided information.
   * @param data - RegisterInput object containing registration data.
   * @returns A promise resolving to RegisterResponse indicating success or failure.
   */
  const register = async (data: RegisterInput): Promise<RegisterResponse> => {
    try {
      const response = await client.post<RegisterResponse>("/user/register", data);
      const res = response.data;

      console.log(response.data.message);
  
      return res;
      
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Unknown error occurred";

      return {success: false, message} as RegisterResponse;
      
    }
  };

  const isLoggedIn = user !== null;

  return { user, isLoggedIn, login, register };
}
