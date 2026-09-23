import React, { useState } from "react"
import { useObligationsStore } from "../store/obligationsSlice"
import { CATEGORY_PALETTE } from "../constants/categories"
import type { Category } from "@/shared/types/domain"

interface CategorySettingsModalProps {
  onClose: () => void
  onCategoryCreated?: (newCategory: Category) => void
}

export const CategorySettingsModal: React.FC<CategorySettingsModalProps> = ({
  onClose,
  onCategoryCreated,
}) => {
  const { categories, obligations, addCategory, updateCategory, deleteCategory } =
    useObligationsStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [colorInput, setColorInput] = useState("emerald")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categoryList = Object.values(categories)

  // Count active obligations per category (status !== 'DELETED')
  const activeObligations = Object.values(obligations).filter((o) => o.status !== "DELETED")
  const getUsageCount = (categoryId: string) => {
    return activeObligations.filter((o) => o.categoryId === categoryId).length
  }

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setNameInput(cat.name)
    setColorInput(cat.color || "emerald")
    setErrorMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNameInput("")
    setColorInput("emerald")
    setErrorMessage(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = nameInput.trim()

    if (!trimmedName) {
      setErrorMessage("El nombre de la categoría no puede estar vacío.")
      return
    }

    if (editingId) {
      updateCategory(editingId, {
        name: trimmedName,
        color: colorInput,
      })
      handleCancelEdit()
    } else {
      const created = addCategory({
        name: trimmedName,
        color: colorInput,
      })
      if (onCategoryCreated) {
        onCategoryCreated(created)
      }
      setNameInput("")
      setColorInput("emerald")
      setErrorMessage(null)
    }
  }

  const handleDelete = (categoryId: string) => {
    const count = getUsageCount(categoryId)
    if (count > 0) {
      setErrorMessage(
        `No se puede eliminar la categoría porque está en uso por ${count} obligación(es) activa(s).`
      )
      return
    }

    deleteCategory(categoryId)
    if (editingId === categoryId) {
      handleCancelEdit()
    }
    setErrorMessage(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full sm:max-w-xl max-h-[90vh] sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Configuración de Categorías</h2>
            <p className="text-xs text-slate-400">
              Personaliza nombres y colores para clasificar tus obligaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="min-h-[44px] min-w-[44px] text-slate-400 hover:text-white flex items-center justify-center rounded-xl hover:bg-slate-800 cursor-pointer text-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 space-y-4 flex-1">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex justify-between items-center"
            >
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                aria-label="Cerrar mensaje de error"
                className="text-rose-400 hover:text-rose-200 ml-2 min-h-[36px] min-w-[36px] px-2 flex items-center justify-center rounded-lg hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition cursor-pointer"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          )}

          {/* Category Form (Create or Edit) */}
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">
                {editingId ? "Editar Categoría" : "Nueva Categoría"}
              </span>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-400 hover:text-slate-200 min-h-[32px] px-2 flex items-center rounded-lg hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Nombre de categoría (ej. Seguros Médicos)"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Color:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(CATEGORY_PALETTE).map(([key, opt]) => (
                    <button
                      key={key}
                      type="button"
                      title={opt.label}
                      onClick={() => setColorInput(key)}
                      className={`min-h-[32px] min-w-[32px] w-8 h-8 rounded-full ${opt.dotClass} cursor-pointer transition ${
                        colorInput === key ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white cursor-pointer shadow transition"
              >
                {editingId ? "Guardar Cambios" : "+ Agregar Categoría"}
              </button>
            </div>
          </form>

          {/* Existing Categories List */}
          <div className="space-y-2 divide-y divide-slate-800/40">
            {categoryList.map((cat) => {
              const usageCount = getUsageCount(cat.id)
              const colorOption = CATEGORY_PALETTE[cat.color] || CATEGORY_PALETTE.emerald

              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-800/30 rounded-lg transition"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3.5 h-3.5 rounded-full ${colorOption?.dotClass} flex-shrink-0`} />
                    <div>
                      <div className="text-sm font-medium text-white">{cat.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {usageCount} {usageCount === 1 ? "obligación activa" : "obligaciones activas"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="min-h-[36px] px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id)}
                      className={`min-h-[36px] px-3 py-1.5 text-xs rounded-lg cursor-pointer transition ${
                        usageCount > 0
                          ? "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                          : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end px-5 py-4 sm:px-6 sm:py-4 border-t border-slate-800 bg-slate-900/90 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 cursor-pointer transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
