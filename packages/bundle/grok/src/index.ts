/**
 * `@deepseek-ai/dsh-grok` — installable Grok Build plugin-library bundle. The
 * patch mounts Imagine media tools and monitor; the catalog names official dsh
 * packages that already cover the rest of the first-party Grok Build toolset so
 * deployments compose them instead of copying source.
 * @module @deepseek-ai/dsh-grok
 */

export { GROK_PLUGIN_CATALOG } from './catalog.ts'
export type { GrokCatalogEntry, GrokCatalogMount, GrokCatalogOrigin } from './catalog.ts'
