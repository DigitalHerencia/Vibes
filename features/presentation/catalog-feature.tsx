import { CatalogBrowser } from "@/components/(presentation)/catalog-browser"
import {
  presentationAssetKinds,
  presentationAssets,
  presentationPageRecipes,
} from "@/content/presentation/registry"

export function CatalogFeature() {
  return (
    <main className="p-6 md:p-12">
      <div className="mx-auto grid max-w-7xl gap-12">
        <header className="max-w-3xl">
          <p className="text-xs font-black tracking-widest text-blue-500 uppercase">
            Presentation system
          </p>
          <h1 className="mt-3 text-4xl leading-none font-black tracking-wide uppercase md:text-6xl">
            Typed asset catalog
          </h1>
          <p className="mt-4 text-sm leading-6 font-semibold text-neutral-400 md:text-base">
            Discover reusable layers, explicit Vouch references, and page recipes without copying
            prototype implementations.
          </p>
        </header>
        <CatalogBrowser
          assets={presentationAssets}
          kinds={presentationAssetKinds}
          recipes={presentationPageRecipes}
        />
      </div>
    </main>
  )
}
