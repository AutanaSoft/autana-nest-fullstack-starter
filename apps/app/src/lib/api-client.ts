import axios from "axios"
import { apiBasePath } from "@autana/contracts/api"

// Sin `VITE_API_URL` usa el origen actual, que en desarrollo reenvía a la API el proxy de Vite. `withCredentials`
// envía la cookie de sesión cuando la API está en otro origen del mismo sitio.
const apiUrl = import.meta.env.VITE_API_URL ?? ""

export const apiClient = axios.create({ baseURL: `${apiUrl}${apiBasePath}`, withCredentials: true })
