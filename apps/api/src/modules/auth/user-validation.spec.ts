import { validateUserFields } from "./user-validation.js"

describe("validación de usuario", () => {
  it("normaliza el nombre y el correo", () => {
    expect(validateUserFields({ name: "  Ana Ruiz  ", email: "ANA@Mail.com" })).toEqual({
      name: "Ana Ruiz",
      email: "ana@mail.com",
    })
  })

  it("no exige los campos que no llegan", () => {
    expect(validateUserFields({})).toEqual({})
  })

  it("rechaza un nombre y un correo inválidos con un código fijo", () => {
    expect(() => validateUserFields({ name: "" })).toThrow(
      expect.objectContaining({
        body: { code: "INVALID_NAME", message: "Invalid name" },
      })
    )
    expect(() => validateUserFields({ email: "no" })).toThrow(
      expect.objectContaining({
        body: { code: "INVALID_EMAIL", message: "Invalid email" },
      })
    )
  })
})
