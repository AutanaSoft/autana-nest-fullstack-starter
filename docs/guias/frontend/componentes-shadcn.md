# Añadir componentes de shadcn/ui

Ejecuta el CLI desde la raíz apuntando a la aplicación. Los archivos se instalan en `packages/ui`:

```bash
npx shadcn@latest add button -c apps/app
```

Si el CLI pregunta por sobrescribir un archivo existente, revisa la diferencia antes de aceptar.

```tsx
import { Button } from "@autana/ui/components/button"
```
