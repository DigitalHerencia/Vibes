import { expect, test } from "@playwright/test"

test("public routes render without authentication", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: /build the app/i })).toBeVisible()

  await page.goto("/pricing")
  await expect(page.getByRole("heading", { name: /bring your pricing model/i })).toBeVisible()

  await page.goto("/faq")
  await expect(page.getByRole("heading", { name: /boundaries before features/i })).toBeVisible()
})

test("tenant routes redirect anonymous users", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/sign-in\?return_to=%2Fdashboard/)
})
