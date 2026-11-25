import { BadRequestException } from "@nestjs/common"
import z from "zod"

import { ContractValidationPipe } from "./contract-validation.pipe.js"

const pipe = new ContractValidationPipe({
  body: { code: "INVALID_BODY", message: "Invalid body" },
  query: { code: "INVALID_QUERY", message: "Invalid query" },
})
const schema = z.object({ name: z.string() })

describe("validación del contrato", () => {
  it("deja pasar un valor válido", async () => {
    await expect(pipe.transform({ name: "a" }, { type: "body", metatype: Object, schema })).resolves.toEqual({
      name: "a",
    })
  })

  it("responde el error público del destino que falló, sin el detalle del esquema", async () => {
    const error = await pipe.transform({}, { type: "query", metatype: Object, schema }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(BadRequestException)
    expect((error as BadRequestException).getResponse()).toEqual({
      code: "INVALID_QUERY",
      message: "Invalid query",
    })
  })

  it("usa el error del cuerpo cuando el destino no tiene uno propio", async () => {
    const error = await pipe.transform({}, { type: "param", metatype: Object, schema }).catch((e: unknown) => e)
    expect((error as BadRequestException).getResponse()).toEqual({
      code: "INVALID_BODY",
      message: "Invalid body",
    })
  })
})
