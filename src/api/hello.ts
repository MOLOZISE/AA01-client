import { api } from "./api"

export async function getHello() {
  const response = await api.get("/api/hello");
  return response.data;
}
