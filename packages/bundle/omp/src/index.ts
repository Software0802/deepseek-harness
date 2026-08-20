/**
 * `@deepseek-ai/dsh-omp` — installable OMP plugin-library bundle. The patch
 * mounts loop and advisor plugins; the catalog names official dsh packages
 * that already cover other OMP extensions so deployments compose them instead
 * of copying source.
 * @module @deepseek-ai/dsh-omp
 */

export { OMP_PLUGIN_CATALOG } from './catalog.ts'
export type { OmpCatalogEntry, OmpCatalogMount, OmpCatalogOrigin } from './catalog.ts'
