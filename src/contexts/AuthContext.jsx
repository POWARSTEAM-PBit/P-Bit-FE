import React, { createContext, useContext, useState, useEffect } from 'react';
import client from "../api/client";

// AuthContext - Manages global authentication state

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        // Initialize from localStorage
        return localStorage.getItem('token');
    });
    const [loading, setLoading] = useState(false);

    // Initialize user profile if token exists on app start
    useEffect(() => {
        if (token && !user) {
            fetchUserProfile(token);
        }
    }, [token, user]);

    /**
     * @brief Fetches user profile using the access token.
     * @param authToken - The access token for authentication.
     */
    const fetchUserProfile = async (authToken) => {
        try {
            const tokenToUse = authToken || token;
            if (!tokenToUse) {
                console.log('No token available for profile fetch');
                return;
            }

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
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            // If profile fetch fails, clear token (might be expired)
            if (error.response?.status === 401) {
                console.log('Token expired, logging out');
                logout();
            }
        }
    };

    /**
     * @brief Logs a user in using OAuth2 form-based authentication.
     * @param data - LoginInput object containing user credentials.
     * @returns A promise resolving to LoginResponse, including access token if successful.
     */
    const login = async (data) => {
        setLoading(true);
        try {
            // Create form data for OAuth2 (required for security)
            const formData = new URLSearchParams();
            formData.append('username', data.user_id);
            formData.append('password', data.password);

            const response = await client.post("/user/login", formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            const res = response.data;

            if (res.success && res.data?.access_token) {
                setToken(res.data.access_token);
                // Store token in localStorage
                localStorage.setItem('token', res.data.access_token);
                // Fetch user profile after successful login
                await fetchUserProfile(res.data.access_token);
            }

            return res;
        } catch (error) {
            const message = error.response?.data?.message || error.message || "Unknown error occurred";
            return {success: false, message};
        } finally {
            setLoading(false);
        }
    };

    /**
     * @brief Registers a new user using the provided information.
     * @param data - RegisterInput object containing registration data.
     * @returns A promise resolving to RegisterResponse indicating success or failure.
     */
    const register = async (data) => {
        setLoading(true);
        try {
            const response = await client.post("/user/register", data);
            const res = response.data;

            console.log(response.data.message);

            return res;

        } catch (error) {
            const message = error.response?.data?.message || error.message || "Unknown error occurred";

            return {success: false, message};

        } finally {
            setLoading(false);
        }
    };

    const isLoggedIn = token !== null;

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const value = {
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
};
