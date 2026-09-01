import { api } from "../../../services/api";

export async function login(username, password) {
  const data = await api.post("/auth/login", { username, password });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  return localStorage.getItem("access_token");
}
