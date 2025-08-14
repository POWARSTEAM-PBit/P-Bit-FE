import { Register } from "react-router-dom";
import client from "./client";
import { ApiResp } from "./int";

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
  token: string;
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

/**
 * @brief The following function relates to the API communication between
 * the frontend and the backend. Login Form data is passed, and promises a 
 * API Response.
 * @param data 
 * @returns 
 */
export const login = async (data: LoginInput): Promise<ApiResp<LoginData>> => {
  const response = await client.post<ApiResp<LoginData>>("/user/login", data);
  return response.data;
};

/**
 * @brief The following function relates to the API communication between
 * the frontend and the backend. Register Form data is passed, and promises a 
 * API Response.
 * @param data 
 * @returns 
 */
export const register = async (data: RegisterInput): Promise<ApiResp<null>> => {
  const response = await client.post<ApiResp<null>>("/user/login", data);
  return response.data;
};