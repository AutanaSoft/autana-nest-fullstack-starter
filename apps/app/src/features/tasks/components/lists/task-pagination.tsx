import { Link } from "react-router"
import { Button, buttonVariants } from "@autana/ui/components/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

type TaskPaginationProps = {
  page: number
  pageCount: number
  getPageSearch: (page: number) => string
}

export function TaskPagination({ page, pageCount, getPageSearch }: TaskPaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex items-center justify-end gap-2">
      <span className="text-sm text-muted-foreground">
        Página {page} de {pageCount}
      </span>
      {/* Los enlaces llevan un `href` real; en los extremos se muestra un botón deshabilitado. */}
      {page > 1 ? (
        <Link
          to={{ search: getPageSearch(page - 1) }}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
        >
          <ChevronLeftIcon />
          <span className="sr-only">Página anterior</span>
        </Link>
      ) : (
        <Button variant="outline" size="icon-sm" disabled>
          <ChevronLeftIcon />
          <span className="sr-only">Página anterior</span>
        </Button>
      )}
      {page < pageCount ? (
        <Link
          to={{ search: getPageSearch(page + 1) }}
          className={buttonVariants({ variant: "outline", size: "icon-sm" })}
        >
          <ChevronRightIcon />
          <span className="sr-only">Página siguiente</span>
        </Link>
      ) : (
        <Button variant="outline" size="icon-sm" disabled>
          <ChevronRightIcon />
          <span className="sr-only">Página siguiente</span>
        </Button>
      )}
    </nav>
  )
}
