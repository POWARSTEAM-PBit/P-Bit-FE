import { ApiResp } from "../api/int";
import client from "../api/client";

export interface CreateClassInput {
  user_id: string;
  class_name: string;
  class_description: string;
  tag: string[];
}

type CreateClassResponse = ApiResp<null>;

export function useClass() {
  const create_class = async ( data: CreateClassInput): Promise<CreateClassResponse> => {
    try {
      const response = await client.post<CreateClassResponse>(
        "/class/create",
        data
      );
      return response.data;
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || "Unknown error";
      return {
        success: false,
        message,
      };
    }
  };

  return { create_class };
}
