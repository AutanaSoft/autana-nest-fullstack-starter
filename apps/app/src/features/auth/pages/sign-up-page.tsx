import { signUp } from "../api/sign-up"
import { SignUpForm } from "../components/forms/sign-up-form"
import type { SignUpValues } from "@autana/contracts/auth"

export function SignUpPage() {
  async function handleSubmit(values: SignUpValues) {
    // No navega: AuthLayout redirige a /tasks cuando la sesión ya existe, y así PanelLayout nunca ve una sesión sin refrescar.
    await signUp(values)
  }

  return <SignUpForm onSubmit={handleSubmit} />
}
