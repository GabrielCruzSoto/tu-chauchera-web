import React from "react"
import { useObligationsStore } from "../store/obligationsSlice"
import { CATEGORY_PALETTE, DEFAULT_CATEGORY_COLOR } from "../constants/categories"

interface CategoryBadgeProps {
  categoryId?: string | null
  className?: string
  showDot?: boolean
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryId,
  className = "",
  showDot = true,
}) => {
  const { categories } = useObligationsStore()
  const category = categoryId ? categories[categoryId] : undefined

  const colorOption =
    (category?.color && CATEGORY_PALETTE[category.color]) || DEFAULT_CATEGORY_COLOR

  const displayName = category?.name ?? "General / Sin Categoría"

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorOption.badgeClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${colorOption.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{displayName}</span>
    </span>
  )
}
