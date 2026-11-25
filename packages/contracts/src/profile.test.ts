import { describe, expect, it } from "vitest"

import { profileLength, updateProfileSchema } from "./profile"

const empty = {
  phone: null,
  address: null,
  addressReference: null,
  alternateContactName: null,
  alternateContactPhone: null,
}

describe("updateProfileSchema", () => {
  it("acepta un perfil vacío", () => {
    expect(updateProfileSchema.parse(empty)).toEqual(empty)
  })

  it("normaliza los textos vacíos a null y recorta los demás", () => {
    expect(
      updateProfileSchema.parse({
        phone: "  ",
        address: "  Calle 1, Quito  ",
        addressReference: "",
        alternateContactName: " Ana ",
        alternateContactPhone: "",
      })
    ).toEqual({
      phone: null,
      address: "Calle 1, Quito",
      addressReference: null,
      alternateContactName: "Ana",
      alternateContactPhone: null,
    })
  })

  it.each(["+593 99 123 4567", "0991234567", "099-123-4567", "+34 600 000 000"])("acepta el teléfono %s", (phone) => {
    expect(updateProfileSchema.safeParse({ ...empty, phone }).success).toBe(true)
  })

  it.each(["123456", "1".repeat(16), "abc1234567", "099 123 45 6x", "(099) 1234567", "++5939912345"])(
    "rechaza el teléfono %s",
    (phone) => {
      expect(updateProfileSchema.safeParse({ ...empty, phone }).success).toBe(false)
    }
  )

  it("aplica la misma regla al teléfono del contacto alternativo", () => {
    expect(updateProfileSchema.safeParse({ ...empty, alternateContactPhone: "12" }).success).toBe(false)
  })

  it.each(["address", "addressReference", "alternateContactName"] as const)("limita el largo de %s", (field) => {
    expect(updateProfileSchema.safeParse({ ...empty, [field]: "a".repeat(profileLength[field]) }).success).toBe(true)
    expect(updateProfileSchema.safeParse({ ...empty, [field]: "a".repeat(profileLength[field] + 1) }).success).toBe(
      false
    )
  })

  it("exige los cinco campos", () => {
    expect(updateProfileSchema.safeParse({ phone: null }).success).toBe(false)
  })
})
