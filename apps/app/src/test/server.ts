import { setupServer } from "msw/node"

// Servidor de MSW compartido: cada prueba declara con `server.use(...)` las respuestas de la API que necesita.
export const server = setupServer()
