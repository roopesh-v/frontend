import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-9xe8.onrender.com/api/v1",
});

export default api;