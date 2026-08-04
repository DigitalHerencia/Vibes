import type {
  PresentationAssetKind,
  PresentationAssetRecord,
  PresentationPageRecipe,
} from "@/types/presentationCatalogTypes"

type AssetSeed = Omit<PresentationAssetRecord, "description" | "tags" | "dependencies"> & {
  description?: string
  tags?: readonly string[]
  dependencies?: readonly string[]
}

function asset(seed: AssetSeed): PresentationAssetRecord {
  return {
    description: seed.description ?? `${seed.label} presentation module.`,
    tags: seed.tags ?? [],
    dependencies: seed.dependencies ?? [],
    ...seed,
  }
}

const primitiveNames = [
  "accordion",
  "alert",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "dialog",
  "dropdown-menu",
  "empty-state",
  "field",
  "input",
  "label",
  "marquee",
  "progress",
  "separator",
  "sheet",
  "skeleton",
  "switch",
  "tabs",
  "textarea",
  "timeline",
] as const

const blockNames = [
  "auth-forms",
  "cta-section",
  "error-pages",
  "faq-section",
  "feature-grid",
  "hero-section",
  "invoice",
  "onboarding-flow",
  "process-panel",
  "settings-page",
  "stats-section",
] as const

const clientFeatureNames = [
  "auth-forms",
  "cta-section",
  "error-pages",
  "faq-section",
  "invoice",
  "onboarding-flow",
  "settings-page",
] as const

const serverFeatureNames = [
  "feature-grid",
  "hero-section",
  "process-panel",
  "stats-section",
] as const

const presentationRouteNames = [...blockNames, "status"] as const

const legacyReferenceRoutes = [
  {
    id: "d1",
    label: "Authenticated Vouch reference D1",
    modulePath: "app/(auth)/(presentation)/D1/page.tsx",
    path: "/D1",
  },
  {
    id: "pa",
    label: "Public Vouch reference pA",
    modulePath: "app/(public)/(presentation)/pA/page.tsx",
    path: "/pA",
  },
  {
    id: "pb",
    label: "Public Vouch reference pB",
    modulePath: "app/(public)/(presentation)/pB/page.tsx",
    path: "/pB",
  },
  {
    id: "pc",
    label: "Public Vouch reference pC",
    modulePath: "app/(public)/(presentation)/pC/page.tsx",
    path: "/pC",
  },
  {
    id: "ta",
    label: "Tenant Vouch reference tA",
    modulePath: "app/(tenant)/(presentation)/tA/page.tsx",
    path: "/tA",
  },
  {
    id: "tb",
    label: "Tenant Vouch reference tB",
    modulePath: "app/(tenant)/(presentation)/tB/page.tsx",
    path: "/tB",
  },
  {
    id: "tc",
    label: "Tenant Vouch reference tC",
    modulePath: "app/(tenant)/(presentation)/tC/page.tsx",
    path: "/tC",
  },
] as const

const title = (value: string) =>
  value
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ")

export const presentationAssetKinds = [
  "primitive",
  "shared",
  "domain",
  "block",
  "feature",
  "route",
  "fixture-reference",
] as const satisfies readonly PresentationAssetKind[]

export const presentationAssets: readonly PresentationAssetRecord[] = [
  ...primitiveNames.map((name) =>
    asset({
      id: `primitive.${name}`,
      label: title(name),
      kind: "primitive",
      modulePath: `components/ui/${name}.tsx`,
      source: "reusable",
      tags: ["control", "foundation"],
    })
  ),
  asset({
    id: "shared.public-shell",
    label: "Public shell",
    kind: "shared",
    modulePath: "components/shells/public-shell.tsx",
    source: "reusable",
    dependencies: ["primitive.button"],
    tags: ["layout", "navigation"],
  }),
  asset({
    id: "shared.auth-shell",
    label: "Authentication shell",
    kind: "shared",
    modulePath: "components/shells/auth-shell.tsx",
    source: "reusable",
    tags: ["layout", "authentication"],
  }),
  asset({
    id: "shared.tenant-shell",
    label: "Tenant shell",
    kind: "shared",
    modulePath: "components/shells/tenant-shell.tsx",
    source: "reusable",
    dependencies: ["primitive.button", "primitive.dropdown-menu"],
    tags: ["layout", "tenant", "navigation"],
  }),
  asset({
    id: "shared.logo-lockup",
    label: "Logo lockup",
    kind: "shared",
    modulePath: "components/brand/logo-lockup.tsx",
    source: "reusable",
    tags: ["brand"],
  }),
  asset({
    id: "domain.project-card",
    label: "Project card",
    kind: "domain",
    modulePath: "components/projects/project-card.tsx",
    source: "reusable",
    dependencies: ["primitive.card"],
    tags: ["project", "tenant"],
  }),
  asset({
    id: "domain.project-form",
    label: "Project form",
    kind: "domain",
    modulePath: "components/projects/project-form.tsx",
    source: "reusable",
    dependencies: ["primitive.button", "primitive.field", "primitive.input"],
    tags: ["project", "form"],
  }),
  asset({
    id: "domain.vouch-status",
    label: "Vouch status",
    description: "Vouch-specific status, confirmation, and creation reference components.",
    kind: "domain",
    modulePath: "components/blocks/status.tsx",
    source: "vouch-reference",
    dependencies: ["primitive.badge", "primitive.timeline", "primitive.sheet"],
    tags: ["vouch", "status", "payment"],
    previewPath: "/status",
  }),
  ...blockNames.map((name) =>
    asset({
      id: `block.${name}`,
      label: `${title(name)} block`,
      kind: "block",
      modulePath: `components/blocks/${name}.tsx`,
      source: "reusable",
      tags: ["composition", name],
      previewPath: `/${name}`,
    })
  ),
  ...clientFeatureNames.map((name) =>
    asset({
      id: `feature.${name}`,
      label: `${title(name)} preview`,
      kind: "feature",
      modulePath: `components/blocks/${name}FeatureClient.tsx`,
      source: name === "onboarding-flow" ? "vouch-reference" : "reusable",
      dependencies: [`block.${name}`],
      tags: ["preview", name],
      previewPath: `/${name}`,
    })
  ),
  ...serverFeatureNames.map((name) =>
    asset({
      id: `feature.${name}`,
      label: `${title(name)} preview`,
      kind: "feature",
      modulePath: `components/blocks/${name}Feature.tsx`,
      source: name === "process-panel" ? "vouch-reference" : "reusable",
      dependencies: [`block.${name}`],
      tags: ["preview", name],
      previewPath: `/${name}`,
    })
  ),
  asset({
    id: "feature.vouch-status",
    label: "Vouch status preview",
    kind: "feature",
    modulePath: "features/presentation/status-feature.tsx",
    source: "vouch-reference",
    dependencies: ["domain.vouch-status"],
    tags: ["vouch", "status", "preview"],
    previewPath: "/status",
  }),
  ...presentationRouteNames.map((name) =>
    asset({
      id: `route.${name}`,
      label: `${title(name)} preview route`,
      kind: "route",
      modulePath: `app/(presentation)/${name}/page.tsx`,
      source:
        name === "status" || name === "process-panel" || name === "onboarding-flow"
          ? "vouch-reference"
          : "reusable",
      dependencies: [name === "status" ? "feature.vouch-status" : `feature.${name}`],
      tags: ["catalog", "preview", name],
      previewPath: `/${name}`,
    })
  ),
  ...legacyReferenceRoutes.map((route) =>
    asset({
      id: `route.${route.id}`,
      label: route.label,
      kind: "route",
      modulePath: route.modulePath,
      source: "vouch-reference",
      tags: ["vouch", "legacy-reference", "preview"],
      previewPath: route.path,
    })
  ),
  asset({
    id: "route.catalog",
    label: "Presentation catalog route",
    kind: "route",
    modulePath: "app/(presentation)/catalog/page.tsx",
    source: "reusable",
    dependencies: ["feature.catalog"],
    tags: ["catalog", "search"],
    previewPath: "/catalog",
  }),
  asset({
    id: "feature.catalog",
    label: "Presentation catalog",
    kind: "feature",
    modulePath: "features/presentation/catalog-feature.tsx",
    source: "reusable",
    tags: ["catalog", "inventory", "recipes"],
    previewPath: "/catalog",
  }),
  asset({
    id: "fixture.vouch-content",
    label: "Vouch presentation content",
    description: "Typed, explicitly non-universal copy for the preserved Vouch reference.",
    kind: "fixture-reference",
    modulePath: "reference-implementations/vouch/presentation-content.ts",
    source: "vouch-reference",
    tags: ["vouch", "copy", "reference"],
  }),
  asset({
    id: "fixture.vouch-status",
    label: "Vouch status fixture",
    description: "Transport-shaped fixture data for the Vouch status preview.",
    kind: "fixture-reference",
    modulePath: "reference-implementations/vouch/presentation-fixtures.ts",
    source: "vouch-reference",
    tags: ["vouch", "fixture", "status"],
  }),
]

export const presentationPageRecipes: readonly PresentationPageRecipe[] = [
  {
    id: "recipe.public-marketing",
    label: "Public marketing",
    description: "Public shell composed with focused hero, feature, CTA, and FAQ blocks.",
    route: "/",
    assetIds: [
      "shared.public-shell",
      "block.hero-section",
      "block.feature-grid",
      "block.cta-section",
      "block.faq-section",
    ],
  },
  {
    id: "recipe.authentication",
    label: "Authentication",
    description: "Authentication shell framing provider-owned sign-in and sign-up surfaces.",
    route: "/sign-in",
    assetIds: ["shared.auth-shell", "block.auth-forms"],
  },
  {
    id: "recipe.tenant-dashboard",
    label: "Tenant dashboard",
    description: "Tenant shell with feature-owned dashboard composition and reusable stats blocks.",
    route: "/dashboard",
    assetIds: ["shared.tenant-shell", "block.stats-section"],
  },
  {
    id: "recipe.project-management",
    label: "Project management",
    description: "Tenant shell with Project cards and action-backed forms.",
    route: "/projects",
    assetIds: ["shared.tenant-shell", "domain.project-card", "domain.project-form"],
  },
  {
    id: "recipe.vouch-reference",
    label: "Vouch status reference",
    description:
      "Preserved Vouch domain composition, explicitly outside the reusable product contract.",
    route: "/status",
    assetIds: ["feature.vouch-status", "domain.vouch-status", "fixture.vouch-status"],
  },
]
