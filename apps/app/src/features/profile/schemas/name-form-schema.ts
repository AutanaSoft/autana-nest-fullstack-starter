import { z } from "zod"
import { nameSchema } from "@autana/contracts/auth"

export const nameFormSchema = z.object({ name: nameSchema })

export type NameFormValues = z.infer<typeof nameFormSchema>
