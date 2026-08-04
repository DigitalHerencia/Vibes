import { expect, test } from "@playwright/test"

test("catalog supports keyboard search and mobile reflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto("/catalog")

  await expect(page.getByRole("heading", { name: "Typed asset catalog" })).toBeVisible()
  const search = page.getByRole("searchbox", { name: "Search assets" })
  await search.focus()
  await page.keyboard.type("Vouch")
  await expect(page.getByRole("status")).toContainText("asset")
  await expect(page.getByRole("heading", { name: "Vouch status", exact: true })).toBeVisible()

  await page.getByRole("combobox", { name: "Responsibility" }).selectOption("fixture-reference")
  await expect(page.getByRole("heading", { name: "Vouch presentation content" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Core page recipes" })).toBeVisible()

  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  )
  expect(horizontalOverflow).toBe(false)
})
