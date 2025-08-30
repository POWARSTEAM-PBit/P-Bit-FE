import { ApiResp } from "../api/int";
import client from "../api/client";

export interface CreateClassInput {
  class_name: string;
  class_description: string;
  tag: string[];
}

type CreateClassResponse = ApiResp<null>;

interface ClassInfo {
  class_id: number;
  class_name: string;
  class_description: string;
  class_code: string;
  enrolled_students: number;
  created_at: string; // timestamp date string
}

type GetClassesResponse = ApiResp<ClassInfo[]>;


export function useClass() {
  const create_class = async (data: CreateClassInput): Promise<CreateClassResponse> => {
  try {
    const response = await client.post<CreateClassResponse>("/class/create", data);
    return response.data;
  } catch (error: any) {
    console.error("Create class API error:", error);

    const message =
      error?.response?.data?.message ||
      error.message ||
      "Unknown error";
    return { success: false, message };
  }
};

  const get_classes = async (): Promise<GetClassesResponse> => {
    try {
      const response = await client.get<GetClassesResponse>("/class/list");
      return response.data;
    } catch (error: any) {
      console.error("Get classes API error:", error);

      const message =
        error?.response?.data?.message ||
        error.message ||
        "Unknown error";
      return { success: false, message, data: [] }; 
    }
  };

  return { create_class, get_classes };
}
