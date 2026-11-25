import { BadRequestException, type ArgumentMetadata, StandardSchemaValidationPipe } from "@nestjs/common"

export type PublicError = { code: string; message: string }

// Convierte un fallo de validación en el error público de la operación, según el destino que falló. El mensaje es
// fijo: el detalle del esquema no sale de la API. Se aplica con `@UsePipes()` en el controlador.
export class ContractValidationPipe extends StandardSchemaValidationPipe {
  constructor(
    private readonly errors: {
      body: PublicError
      query?: PublicError
      param?: PublicError
    }
  ) {
    super()
  }

  override async transform<T = unknown>(value: T, metadata: ArgumentMetadata): Promise<T> {
    try {
      return await super.transform(value, metadata)
    } catch (error) {
      if (!(error instanceof BadRequestException)) throw error
      const target = metadata.type === "query" || metadata.type === "param" ? metadata.type : "body"
      throw new BadRequestException(this.errors[target] ?? this.errors.body)
    }
  }
}
