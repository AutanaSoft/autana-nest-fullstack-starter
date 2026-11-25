import { z } from "zod"

// Límites de cada campo del perfil. Todos son opcionales: un texto vacío equivale a no haberlo indicado.
export const profileLength = {
  phone: 20,
  address: 200,
  addressReference: 100,
  alternateContactName: 50,
} as const

// Formato internacional flexible: `+` opcional, y dígitos separados por espacios o guiones. No comprueba que el
// número exista ni valida el plan de numeración de cada país.
const phonePattern = /^\+?[\d\s-]+$/
const phoneDigits = { min: 7, max: 15 } as const

function isValidPhone(value: string) {
  const digits = value.replaceAll(/\D/g, "").length
  return phonePattern.test(value) && digits >= phoneDigits.min && digits <= phoneDigits.max
}

const phoneMessage = "Escribe un teléfono válido, con entre 7 y 15 dígitos."

// Recorta el texto y lo normaliza a `null` cuando queda vacío, para que la base no guarde cadenas vacías.
const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .nullable()
    .transform((value) => value || null)

const optionalPhone = z
  .string()
  .trim()
  .max(profileLength.phone, phoneMessage)
  .refine((value) => value === "" || isValidPhone(value), phoneMessage)
  .nullable()
  .transform((value) => value || null)

// Los cinco campos se envían siempre: guardar el perfil lo reemplaza entero.
export const updateProfileSchema = z.object({
  phone: optionalPhone,
  address: optionalText(
    profileLength.address,
    `La dirección no puede superar los ${profileLength.address} caracteres.`
  ),
  addressReference: optionalText(
    profileLength.addressReference,
    `La referencia no puede superar los ${profileLength.addressReference} caracteres.`
  ),
  alternateContactName: optionalText(
    profileLength.alternateContactName,
    `El nombre no puede superar los ${profileLength.alternateContactName} caracteres.`
  ),
  alternateContactPhone: optionalPhone,
})

// Un perfil que aún no se ha guardado se devuelve con todos los campos a `null`.
export const profileSchema = z.object({
  phone: z.string().nullable(),
  address: z.string().nullable(),
  addressReference: z.string().nullable(),
  alternateContactName: z.string().nullable(),
  alternateContactPhone: z.string().nullable(),
})

export type Profile = z.infer<typeof profileSchema>
export type ProfileFormValues = z.input<typeof updateProfileSchema>
export type UpdateProfileValues = z.infer<typeof updateProfileSchema>
