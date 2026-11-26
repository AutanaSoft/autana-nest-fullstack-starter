import { Controller, Post } from "@nestjs/common"

// Escritura que exige sesión, para probar la protección CSRF y el límite de escrituras: la API base no tiene rutas
// propias que cambien estado fuera de Better Auth.
@Controller("test")
export class ProtectedWriteController {
  @Post("protected")
  write() {
    return {}
  }
}
