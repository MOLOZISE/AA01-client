// src/api/api.ts

import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// (선택) 여기에 interceptors 추가 가능
// api.interceptors.response.use( ... )
