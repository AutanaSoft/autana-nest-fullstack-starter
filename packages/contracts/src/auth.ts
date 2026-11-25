import { z } from "zod"

// Reglas de la cuenta que comparten el formulario y el servidor. Los mensajes son el texto del formulario, que está
// en el idioma del producto. La API no los expone: responde con un código público por campo (INVALID_NAME, ...).

// Mínimo y máximo de la contraseña. Better Auth los aplica con estos mismos valores.
export const passwordLength = { min: 8, max: 64 } as const

// Letras de cualquier alfabeto, separadas por un único espacio, guion o apóstrofo.
const namePattern = /^\p{L}+(?:[ '’-]\p{L}+)*$/u

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Escribe tu nombre y apellido.")
  .max(50, "El nombre no puede superar los 50 caracteres.")
  .regex(namePattern, "Usa solo letras, sin números ni símbolos.")

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(100, "El correo no puede superar los 100 caracteres.")
  .pipe(z.email("Escribe un correo válido."))

// La contraseña no se recorta: hacerlo la modificaría sin que el usuario lo sepa.
export const passwordSchema = z
  .string()
  .min(passwordLength.min, `La contraseña debe tener al menos ${passwordLength.min} caracteres.`)
  .max(passwordLength.max, `La contraseña no puede superar los ${passwordLength.max} caracteres.`)

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  // No valida la longitud para no bloquear cuentas existentes si cambia la política.
  password: z.string().min(1, "Escribe tu contraseña."),
})

export type SignUpValues = z.infer<typeof signUpSchema>
export type SignInValues = z.infer<typeof signInSchema>
