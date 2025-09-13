import React, { createContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("access_token") || null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (token) {
            setAuthToken(token);
            localStorage.setItem("access_token", token);
            // fetch current user
            api.get("/users/me/").then((res) => setUser(res.data)).catch(() => logout());
        } else {
            setAuthToken(null);
            localStorage.removeItem("access_token");
            setUser(null);
        }
    }, [token]);

    const login = async (username, password) => {
        const res = await api.post("/token/", { username, password });
        setToken(res.data.access);
        return res;
    };

    const logout = () => {
        localStorage.removeItem("access_token");
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, setToken, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
