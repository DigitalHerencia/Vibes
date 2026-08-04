export type PresentationAssetKind =
  | "primitive"
  | "shared"
  | "domain"
  | "block"
  | "feature"
  | "route"
  | "fixture-reference"

export type PresentationAssetSource = "reusable" | "vouch-reference"

export interface PresentationAssetRecord {
  id: string
  label: string
  description: string
  kind: PresentationAssetKind
  modulePath: string
  source: PresentationAssetSource
  tags: readonly string[]
  dependencies: readonly string[]
  previewPath?: string
}

export interface PresentationPageRecipe {
  id: string
  label: string
  description: string
  route: string
  assetIds: readonly string[]
}
