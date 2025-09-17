import React, { createContext, useState } from "react";
import API from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem("token");
        const email = localStorage.getItem("email");
        const refreshToken = localStorage.getItem("refreshToken");
        const role = localStorage.getItem("role");
        const business_id = localStorage.getItem("business_id");
        return token ? { token, refreshToken, role, business_id, email } : null;
    });

    const saveAuthData = (data, email) => {
        localStorage.setItem("token", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        localStorage.setItem("email", email || data.email || "");
        if (data.role) localStorage.setItem("role", data.role);
        if (data.business_id !== undefined && data.business_id !== null) {
            localStorage.setItem("business_id", data.business_id);
        }
        setUser({
            token: data.access,
            refreshToken: data.refresh,
            email: email || data.email || "",
            role: data.role,
            business_id: data.business_id,
        });
    };
    

    const login = async (email, password) => {
        try {
            const res = await API.post("/token/", { email, password });
            saveAuthData(res.data, email);
            return true;
        } catch (err) {
            console.error("Login failed", err);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("email");
        localStorage.removeItem("role");
        localStorage.removeItem("business_id");
        setUser(null);
        window.location.href = "/login";
    };

    const completeSetPassword = async (uid, token, newPassword) => {
        try {
            const res = await API.post("/auth/set-password/", {
                uid,
                token,
                new_password: newPassword,
            });

            // backend should return { access, refresh, role, business_id, email }
            saveAuthData(res.data, res.data.email);

            return true;
        } catch (err) {
            console.error("Set password failed", err);
            return false;
        }
    };
    

    return (
        <AuthContext.Provider value={{ user, login, logout, completeSetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};


