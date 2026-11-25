import { Alert, AlertDescription } from "@autana/ui/components/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@autana/ui/components/card"
import { Skeleton } from "@autana/ui/components/skeleton"

import { authClient } from "@/lib/auth-client"

import { updateName } from "../api/update-name"
import { NameForm } from "../components/forms/name-form"
import { ProfileForm } from "../components/forms/profile-form"
import { useProfileQuery } from "../hooks/use-profile-query"
import { useUpdateProfileMutation } from "../hooks/use-update-profile-mutation"

export function ProfilePage() {
  const session = authClient.useSession()
  const profile = useProfileQuery()
  const updateProfile = useUpdateProfileMutation()

  return (
    <div className="flex max-w-2xl flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Cuenta</CardTitle>
          <CardDescription>Tu nombre y el correo con el que accedes.</CardDescription>
        </CardHeader>
        <CardContent>
          {session.data ? (
            <NameForm
              name={session.data.user.name}
              email={session.data.user.email}
              onSubmit={({ name }) => updateName(name)}
            />
          ) : (
            <Skeleton className="h-40 w-full" />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Datos de contacto</CardTitle>
          <CardDescription>Todos los campos son opcionales.</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.isPending ? (
            <Skeleton className="h-64 w-full" />
          ) : profile.isError ? (
            <Alert variant="destructive">
              <AlertDescription>No pudimos cargar tu perfil. Inténtalo de nuevo.</AlertDescription>
            </Alert>
          ) : (
            <ProfileForm
              profile={profile.data}
              onSubmit={async (values) => {
                await updateProfile.mutateAsync(values)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
