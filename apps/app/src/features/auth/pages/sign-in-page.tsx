import { signIn } from "../api/sign-in"
import { SignInForm } from "../components/forms/sign-in-form"
import type { SignInValues } from "@autana/contracts/auth"

export function SignInPage() {
  async function handleSubmit(values: SignInValues) {
    // No navega: AuthLayout redirige a /tasks cuando la sesión ya existe, y así PanelLayout nunca ve una sesión sin refrescar.
    await signIn(values)
  }

  return <SignInForm onSubmit={handleSubmit} />
}
