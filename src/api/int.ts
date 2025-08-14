/**
 * @brief The following interface, refers to
 * an API ERROR response from the FastAPI Backend
 */
export interface ErrorResp {
  code: number;
  details?: string | null;
}

/**
 * @brief The following interface, refers
 * to an API Response from the FastAPI Backend
 * The data attribute can be any.
 */
export interface ApiResp<T = any> {
  success: boolean; //true or false, false is error, true no error
  message: string; //user was successfully logged in
  data?: T | null; //something or nothing
  error?: ErrorResp | null; //if null no error
}