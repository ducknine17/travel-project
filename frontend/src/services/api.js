import axios from "axios";

const api = axios.create({
    baseURL: "https://api.bef-trip.my"
});

export default api;