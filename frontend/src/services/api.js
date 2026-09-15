import axios from "axios";

const api = axios.create({
    baseURL: "https://api.bef-trip.my",
    timeout: 15000,
});

if (process.env.NODE_ENV === "development" && process.env.REACT_APP_DESIGN_PREVIEW === "true") {
    require("../dev/designPreview").installDesignPreview(api);
}

// 요청을 보내기 전에 JWT 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
