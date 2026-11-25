import { UserValidationHook } from "./user-validation.hook.js"

describe("UserValidationHook", () => {
  const hook = new UserValidationHook()

  it.each(["beforeCreate", "beforeUpdate"] as const)("%s normaliza el nombre y el correo", (method) => {
    expect(hook[method]({ name: "  Ana Ruiz  ", email: "ANA@Mail.com" })).toEqual({
      data: { name: "Ana Ruiz", email: "ana@mail.com" },
    })
  })

  it("no exige los campos que no llegan", () => {
    expect(hook.beforeUpdate({})).toEqual({ data: {} })
  })

  it.each(["beforeCreate", "beforeUpdate"] as const)("%s rechaza un nombre y un correo inválidos", (method) => {
    expect(() => hook[method]({ name: "" })).toThrow(
      expect.objectContaining({ body: { code: "INVALID_NAME", message: "Invalid name" } })
    )
    expect(() => hook[method]({ email: "no" })).toThrow(
      expect.objectContaining({ body: { code: "INVALID_EMAIL", message: "Invalid email" } })
    )
  })
})
