import { SetMetadata } from "@nestjs/common"

export const IS_PUBLIC = "isPublic"

// Abre una ruta o un controlador al guard de sesión global.
export const Public = () => SetMetadata(IS_PUBLIC, true)
