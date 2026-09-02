import type { Category, UUID } from "@/shared/types/domain"

export interface CategoryColorOption {
  key: string
  label: string
  badgeClass: string
  dotClass: string
}

export const CATEGORY_PALETTE: Record<string, CategoryColorOption> = {
  emerald: {
    key: "emerald",
    label: "Esmeralda",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    dotClass: "bg-emerald-400",
  },
  indigo: {
    key: "indigo",
    label: "Índigo",
    badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30",
    dotClass: "bg-indigo-400",
  },
  cyan: {
    key: "cyan",
    label: "Cian",
    badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    dotClass: "bg-cyan-400",
  },
  orange: {
    key: "orange",
    label: "Naranja",
    badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    dotClass: "bg-orange-400",
  },
  violet: {
    key: "violet",
    label: "Violeta",
    badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/30",
    dotClass: "bg-violet-400",
  },
  rose: {
    key: "rose",
    label: "Rosa",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    dotClass: "bg-rose-400",
  },
  sky: {
    key: "sky",
    label: "Cielo",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/30",
    dotClass: "bg-sky-400",
  },
  purple: {
    key: "purple",
    label: "Púrpura",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    dotClass: "bg-purple-400",
  },
  amber: {
    key: "amber",
    label: "Ámbar",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    dotClass: "bg-amber-400",
  },
}

export const DEFAULT_CATEGORY_COLOR: CategoryColorOption = {
  key: "slate",
  label: "General",
  badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
  dotClass: "bg-slate-400",
}

export const DEFAULT_CATEGORIES: Record<UUID, Category> = {
  "cat-bancos": {
    id: "cat-bancos",
    name: "Bancos & Créditos",
    color: "emerald",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-hipotecario": {
    id: "cat-hipotecario",
    name: "Hipotecario",
    color: "indigo",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-automotriz": {
    id: "cat-automotriz",
    name: "Automotriz",
    color: "cyan",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-retail": {
    id: "cat-retail",
    name: "Tarjetas & Retail",
    color: "orange",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-educacion": {
    id: "cat-educacion",
    name: "Educación",
    color: "violet",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-salud": {
    id: "cat-salud",
    name: "Salud & Seguros",
    color: "rose",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-servicios": {
    id: "cat-servicios",
    name: "Servicios Básicos",
    color: "sky",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-suscrip": {
    id: "cat-suscrip",
    name: "Suscripciones",
    color: "purple",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-impuestos": {
    id: "cat-impuestos",
    name: "Impuestos & Contribuciones",
    color: "amber",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  "cat-terceros": {
    id: "cat-terceros",
    name: "Deudas con terceros",
    color: "amber",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
}
