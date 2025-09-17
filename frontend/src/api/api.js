import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach access token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle expired access token automatically
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // ❌ Don't run refresh logic on login or refresh endpoints
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !(originalRequest.url && originalRequest.url.includes("/token/")) &&
            !(originalRequest.url && originalRequest.url.includes("/auth/set-password/"))

        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                const res = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
                    refresh: refreshToken,
                });

                // Save new access token
                localStorage.setItem("token", res.data.access);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return API(originalRequest);
            } catch (err) {
                // Refresh token invalid → logout user
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("role");
                localStorage.removeItem("business_id");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default API;

