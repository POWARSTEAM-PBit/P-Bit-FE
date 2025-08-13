import { useState } from "react";
import { login as loginApi, User, LoginInput, LoginData } from "../api/auth";
import { ApiResp } from "../api/int";

type LoginResponse = ApiResp<LoginData>;

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

  return { user, login };
}
