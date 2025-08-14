import { useState } from "react";
import { login as loginApi, register as registerAPI, User, LoginInput, LoginData, RegisterInput} from "../api/auth";
import { ApiResp } from "../api/int";

type LoginResponse = ApiResp<LoginData>;
type RegisterResponse = ApiResp<null>; // Adjust this if you know what `registerAPI` returns

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = async (data: LoginInput): Promise<LoginResponse> => {
    const res = await loginApi(data);

    if (res.success && res.data) {
      setUser(res.data.user);
    } else {
      console.error(res.message);
    }

    return res;
  };

  const register = async (data: RegisterInput): Promise<RegisterResponse> => {
    // Validation logic (currently just commented out)
    if (!data.first_name.trim() || !data.last_name.trim() || !data.password.trim()) {
      console.error("First name, Last name, and Password are required.");
    }
    if (data.password.length < 8) {
      console.error("Password must be at least 8 characters.");
    }

    if (!data.user_id.trim()) {
      if (data.user_type === "teacher") {
        console.error("Email is required for teacher registration.");
      } else {
        console.error("Username is required for student registration.");
      }
    }

    const res = await registerAPI(data);

    if (!res.success) {
      console.error(res.message);
    }

    return res;
  };

  return { user, login, register };
}
