import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import {
  presentationAssetKinds,
  presentationAssets,
  presentationPageRecipes,
} from "@/content/presentation/registry"

const root = process.cwd()

describe("presentation catalog contract", () => {
  it("classifies every registered asset with a resolvable source module", () => {
    const ids = new Set(presentationAssets.map((asset) => asset.id))

    expect(ids.size).toBe(presentationAssets.length)
    expect(new Set(presentationAssets.map((asset) => asset.kind))).toEqual(
      new Set(presentationAssetKinds)
    )
    for (const asset of presentationAssets) {
      expect(existsSync(join(root, asset.modulePath)), asset.modulePath).toBe(true)
      for (const dependency of asset.dependencies) {
        expect(ids.has(dependency), `${asset.id} -> ${dependency}`).toBe(true)
      }
    }
  })

  it("builds recipes entirely from registered layers", () => {
    const ids = new Set(presentationAssets.map((asset) => asset.id))
    for (const recipe of presentationPageRecipes) {
      expect(recipe.assetIds.length).toBeGreaterThan(1)
      expect(recipe.assetIds.every((assetId) => ids.has(assetId))).toBe(true)
    }
  })

  it("keeps the catalog out of normal production routes by default", () => {
    const layout = readFileSync(join(root, "app/(presentation)/layout.tsx"), "utf8")
    const access = readFileSync(join(root, "lib/presentation/catalogAccess.ts"), "utf8")
    const proxy = readFileSync(join(root, "proxy.ts"), "utf8")
    expect(access).toContain('process.env.PRESENTATION_CATALOG_ENABLED === "true"')
    expect(layout).toContain("notFound()")
    expect(layout).toContain("index: false")
    expect(layout).toContain("follow: false")
    expect(proxy).toContain("isPresentationRoute(req) && isPresentationCatalogEnabled()")
  })

  it("marks Vouch content and fixtures as explicit references", () => {
    const vouchAssets = presentationAssets.filter((asset) => asset.tags.includes("vouch"))
    expect(vouchAssets.length).toBeGreaterThan(0)
    expect(vouchAssets.every((asset) => asset.source === "vouch-reference")).toBe(true)
  })
})
