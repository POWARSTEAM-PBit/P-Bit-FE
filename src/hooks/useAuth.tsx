import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { ApiResp } from "../api/int";
import client from "../api/client";

/**
 * @brief The following interface, describes a user type
 * Based on the backend user profile response
 */
export interface User {
    user_id: string; // email for teacher, username for student
    first_name: string;
    last_name: string;
    user_type: "student" | "teacher";
    email?: string; // for backward compatibility
    username?: string; // for backward compatibility
    name?: string; // computed from first_name + last_name
    role?: "student" | "teacher"; // alias for user_type
}

/**
 * @brief The interface relates to what data (payload) is
 * received from communicating with the backend API.
 */
export interface LoginData {
    access_token: string;
    token_type: string;
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

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoggedIn: boolean;
    loading: boolean;
    login: (data: LoginInput) => Promise<LoginResponse>;
    register: (data: RegisterInput) => Promise<RegisterResponse>;
    logout: () => void;
    fetchUserProfile: (authToken?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => {
        // Initialize from localStorage
        return localStorage.getItem('token');
    });
    const [loading, setLoading] = useState(false);
    
    // Use ref to prevent multiple calls
    const profileFetched = useRef(false);
    const isInitialized = useRef(false);

    // Initialize user profile if token exists on app start
    useEffect(() => {
        if (isInitialized.current) return; // Prevent re-runs in strict mode
        isInitialized.current = true;
        
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken && !user && !profileFetched.current) {
                profileFetched.current = true;
                await fetchUserProfile(storedToken);
            }
        };
        
        initializeAuth();
    }, []); // Only run once on mount

    /**
     * @brief Logs a user in using OAuth2 form-based authentication.
     * @param data - LoginInput object containing user credentials.
     * @returns A promise resolving to LoginResponse, including access token if successful.
     */
    const login = async (data: LoginInput): Promise<LoginResponse> => {
        setLoading(true);
        try {
            // Create form data for OAuth2 (required for security)
            const formData = new URLSearchParams();
            formData.append('username', data.user_id);
            formData.append('password', data.password);

            const response = await client.post<LoginResponse>("/user/login", formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const res = response.data;

            if (res.success && res.data?.access_token) {
                setToken(res.data.access_token);
                localStorage.setItem('token', res.data.access_token);
                // Fetch user profile immediately after login
                profileFetched.current = true; // Prevent useEffect from calling it again
                await fetchUserProfile(res.data.access_token);
            }

            return res;
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Unknown error occurred";
            return {success: false, message} as LoginResponse;
        } finally {
            setLoading(false);
        }
    };

    /**
     * @brief Fetches user profile using the access token.
     * @param authToken - The access token for authentication.
     */
    const fetchUserProfile = async (authToken?: string) => {
        try {
            const tokenToUse = authToken || token;
            if (!tokenToUse) {
                console.log('No token available for profile fetch');
                return;
            }

            // Add this check to prevent duplicate calls
            if (profileFetched.current && !authToken) {
                console.log('Profile already fetched, skipping');
                return;
            }

            console.log('Fetching user profile...'); // Debug log
            
            const response = await client.get("/user/profile", {
                headers: {
                    'Authorization': `Bearer ${tokenToUse}`,
                },
            });

            // Check if response has success field (wrapped format) or is direct user data
            if (response.data.success) {
                setUser(response.data.data);
            } else if (response.data.user_id) {
                // Direct user data format
                setUser(response.data);
            }
        } catch (error: any) {
            console.error('Failed to fetch user profile:', error);
            // If profile fetch fails, clear token (might be expired)
            if (error.response?.status === 401) {
                console.log('Token expired, logging out');
                logout();
            }
        }
    };

    /**
     * @brief Registers a new user using the provided information.
     * @param data - RegisterInput object containing registration data.
     * @returns A promise resolving to RegisterResponse indicating success or failure.
     */
    const register = async (data: RegisterInput): Promise<RegisterResponse> => {
        setLoading(true);
        try {
            const response = await client.post<RegisterResponse>("/user/register", data);
            const res = response.data;

            console.log(response.data.message);

            return res;

        } catch (error: any) {
            const message = error.response?.data?.message || error.message || "Unknown error occurred";

            return {success: false, message} as RegisterResponse;

        } finally {
            setLoading(false);
        }
    };

    const isLoggedIn = token !== null;

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        profileFetched.current = false; // Reset the flag
        isInitialized.current = false; // Reset initialization flag
    };

    const value: AuthContextType = {
        user,
        token,
        isLoggedIn,
        loading,
        login,
        register,
        logout,
        fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * @brief Custom React hook to access authentication context.
 * @returns AuthContextType object containing user state and auth functions.
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}