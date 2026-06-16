/*
 * Re-export of the canonical Verti-Grade domain models.
 *
 * The single source of truth lives in the root-level `types/models.ts` so
 * that client (`~/types/models`) and server (`../../../types/models`) code
 * share identical record shapes. Keep this file as a thin re-export only.
 */

export * from '../../types/models'
