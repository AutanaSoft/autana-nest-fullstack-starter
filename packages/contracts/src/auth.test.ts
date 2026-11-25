import { emailSchema, nameSchema, passwordSchema, signInSchema, signUpSchema } from "./auth"
import { describe, expect, it } from "vitest"

describe("nameSchema", () => {
  it.each(["Ana", "Ana Ruiz", "María-José O'Brien", "Zoë Ünal", "Ana Ruiz Pérez"])("acepta %s", (name) => {
    expect(nameSchema.safeParse(name).success).toBe(true)
  })

  it.each(["Ana2", "Ana@", "Ana  Ruiz", "<b>Ana</b>", "Ana_Ruiz", "-Ana", "Ana-", "", "   ", "a".repeat(51)])(
    "rechaza %j",
    (name) => {
      expect(nameSchema.safeParse(name).success).toBe(false)
    }
  )

  it("recorta los espacios de los extremos y admite 50 caracteres", () => {
    expect(nameSchema.parse("  Ana Ruiz  ")).toBe("Ana Ruiz")
    expect(nameSchema.safeParse("a".repeat(50)).success).toBe(true)
  })
})

describe("emailSchema", () => {
  it("recorta y pasa a minúsculas", () => {
    expect(emailSchema.parse("  ANA@Mail.COM ")).toBe("ana@mail.com")
  })

  it("admite 100 caracteres y rechaza más", () => {
    expect(emailSchema.safeParse(`${"a".repeat(90)}@mail.com`).success).toBe(true)
    expect(emailSchema.safeParse(`${"a".repeat(95)}@mail.com`).success).toBe(false)
  })

  it.each(["no-es-correo", "a@", "@b.com", ""])("rechaza %j", (email) => {
    expect(emailSchema.safeParse(email).success).toBe(false)
  })
})

describe("passwordSchema", () => {
  it("exige entre 8 y 64 caracteres", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false)
    expect(passwordSchema.safeParse("12345678").success).toBe(true)
    expect(passwordSchema.safeParse("x".repeat(64)).success).toBe(true)
    expect(passwordSchema.safeParse("x".repeat(65)).success).toBe(false)
  })

  it("no recorta los espacios", () => {
    expect(passwordSchema.parse("  12345678  ")).toBe("  12345678  ")
    expect(passwordSchema.safeParse("  1234  ").success).toBe(true)
  })
})

describe("formularios", () => {
  it("el registro valida los tres campos", () => {
    expect(signUpSchema.safeParse({ name: "Ana", email: "a@b.co", password: "12345678" }).success).toBe(true)
    expect(signUpSchema.safeParse({ name: "Ana2", email: "a@b.co", password: "12345678" }).success).toBe(false)
  })

  it("el inicio de sesión solo exige una contraseña no vacía", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "1" }).success).toBe(true)
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false)
  })
})
