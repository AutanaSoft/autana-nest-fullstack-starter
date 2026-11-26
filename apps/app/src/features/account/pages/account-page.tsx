import { Badge } from "@autana/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autana/ui/components/card"
import { Skeleton } from "@autana/ui/components/skeleton"

import { authClient } from "@/lib/auth-client"

import { updateName } from "../api/update-name"
import { NameForm } from "../components/forms/name-form"

const dateFormat = new Intl.DateTimeFormat("es", { dateStyle: "long" })

// Los datos salen de la sesión de Better Auth: la cuenta no tiene endpoints ni tablas propias.
export function AccountPage() {
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <div className="flex max-w-2xl flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>Tu nombre y el correo con el que accedes.</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <NameForm name={user.name} email={user.email} onSubmit={({ name }) => updateName(name)} />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Datos de la cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted-foreground">Correo verificado</dt>
              <dd>
                <Badge variant={user.emailVerified ? "outline" : "secondary"}>
                  {user.emailVerified ? "Verificado" : "Sin verificar"}
                </Badge>
              </dd>
              <dt className="text-muted-foreground">Fecha de alta</dt>
              <dd>{dateFormat.format(new Date(user.createdAt))}</dd>
            </dl>
          ) : (
            <Skeleton className="h-16 w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
