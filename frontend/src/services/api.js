/**
 * Cliente HTTP base para consumir la API.
 * Adjunta automáticamente el token JWT del localStorage.
 */

// En producción Docker VITE_API_URL se deja vacío: Nginx hace el proxy a /api/
// En desarrollo sin Docker se puede setear a http://IP:8000/api/v1
// Si no está definido o está vacío, usa ruta relativa (funciona con Vite proxy y con Nginx).
const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

async function request(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    return;
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    const detail = error.detail;
    let message;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      // FastAPI validation errors: [{msg: "...", loc: [...], type: "..."}]
      message = detail.map((d) => d.msg ?? JSON.stringify(d)).join(" · ");
    } else if (detail && typeof detail === "object") {
      // Ej: { valida: false, errores: ["..."] }
      if (Array.isArray(detail.errores) && detail.errores.length > 0) {
        message = detail.errores.join(" · ");
      } else {
        message = JSON.stringify(detail);
      }
    } else {
      message = "Error desconocido";
    }
    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  get:    (path)        => request(path, { method: "GET" }),
  post:   (path, body)  => request(path, { method: "POST",  body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: "PUT",   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: "DELETE" }),

  /** Descarga un archivo con autenticación y lo ofrece al usuario. */
  download: async (path, filename) => {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    if (res.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return;
    }
    if (!res.ok) throw new Error(`Error al descargar: ${res.statusText}`);
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const name = filename
      ?? disposition.match(/filename="(.+?)"/)?.[1]
      ?? "descarga";
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  },
};
