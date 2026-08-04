"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type {
  PresentationAssetKind,
  PresentationAssetRecord,
  PresentationPageRecipe,
} from "@/types/presentationCatalogTypes"

interface CatalogBrowserProps {
  assets: readonly PresentationAssetRecord[]
  kinds: readonly PresentationAssetKind[]
  recipes: readonly PresentationPageRecipe[]
}

export function CatalogBrowser({ assets, kinds, recipes }: CatalogBrowserProps) {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<PresentationAssetKind | "all">("all")
  const filteredAssets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return assets.filter((item) => {
      const matchesKind = kind === "all" || item.kind === kind
      const searchText = [item.label, item.description, item.kind, item.source, ...item.tags]
        .join(" ")
        .toLocaleLowerCase()
      return matchesKind && (!normalizedQuery || searchText.includes(normalizedQuery))
    })
  }, [assets, kind, query])

  return (
    <div className="grid gap-12">
      <section aria-labelledby="catalog-assets-heading" className="grid gap-6">
        <div className="grid gap-2">
          <h2 id="catalog-assets-heading" className="text-2xl font-black uppercase">
            Asset inventory
          </h2>
          <p className="text-sm text-neutral-400">
            Search by name, responsibility, source, or tag. Vouch references remain visibly marked.
          </p>
        </div>

        <div className="grid gap-4 border border-neutral-700 bg-neutral-950 p-4 md:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="grid gap-2">
            <label htmlFor="catalog-search" className="text-xs font-bold tracking-widest uppercase">
              Search assets
            </label>
            <Input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try status, navigation, form…"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="catalog-kind" className="text-xs font-bold tracking-widest uppercase">
              Responsibility
            </label>
            <select
              id="catalog-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as PresentationAssetKind | "all")}
              className="h-11 border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All responsibilities</option>
              {kinds.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p role="status" aria-live="polite" className="text-sm font-bold text-neutral-300">
          {filteredAssets.length} {filteredAssets.length === 1 ? "asset" : "assets"}
        </p>

        {filteredAssets.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredAssets.map((item) => (
              <li key={item.id} className="min-w-0 border border-neutral-700 bg-black p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{item.kind}</Badge>
                  {item.source === "vouch-reference" ? (
                    <Badge variant="secondary">Vouch reference</Badge>
                  ) : null}
                </div>
                <h3 className="mt-4 text-lg font-black uppercase">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{item.description}</p>
                <code className="mt-4 block text-xs break-all text-blue-400">
                  {item.modulePath}
                </code>
                {item.previewPath ? (
                  <Link
                    href={item.previewPath}
                    className="mt-4 inline-flex min-h-11 items-center font-bold text-blue-400 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4"
                  >
                    Open preview
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="border border-neutral-700 p-6 text-neutral-300">
            No assets match this search.
          </p>
        )}
      </section>

      <section aria-labelledby="catalog-recipes-heading" className="grid gap-6">
        <div className="grid gap-2">
          <h2 id="catalog-recipes-heading" className="text-2xl font-black uppercase">
            Core page recipes
          </h2>
          <p className="text-sm text-neutral-400">
            Recipes reference registered layers; they do not duplicate component implementations.
          </p>
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {recipes.map((recipe) => (
            <li key={recipe.id} className="border border-neutral-700 p-5">
              <p className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                {recipe.route}
              </p>
              <h3 className="mt-2 text-lg font-black uppercase">{recipe.label}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-400">{recipe.description}</p>
              <ul aria-label={`${recipe.label} layers`} className="mt-4 flex flex-wrap gap-2">
                {recipe.assetIds.map((assetId) => (
                  <li key={assetId}>
                    <Badge variant="outline">{assetId}</Badge>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
