import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CatalogBrowser } from "@/components/(presentation)/catalog-browser"
import {
  presentationAssetKinds,
  presentationAssets,
  presentationPageRecipes,
} from "@/content/presentation/registry"

describe("presentation catalog browser", () => {
  it("supports labeled keyboard search and responsibility filtering", async () => {
    const user = userEvent.setup()
    render(
      <CatalogBrowser
        assets={presentationAssets}
        kinds={presentationAssetKinds}
        recipes={presentationPageRecipes}
      />
    )

    const search = screen.getByRole("searchbox", { name: "Search assets" })
    await user.click(search)
    await user.keyboard("Vouch")
    expect(screen.getByRole("status")).toHaveTextContent(/assets?$/)
    expect(screen.getByRole("heading", { name: /^Vouch status$/ })).toBeVisible()

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Responsibility" }),
      "fixture-reference"
    )
    expect(screen.getByRole("heading", { name: "Vouch presentation content" })).toBeVisible()
    expect(screen.queryByRole("heading", { name: /^Vouch status$/ })).not.toBeInTheDocument()
  })
})
