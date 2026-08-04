import "server-only"

export function isPresentationCatalogEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.PRESENTATION_CATALOG_ENABLED === "true"
  )
}
