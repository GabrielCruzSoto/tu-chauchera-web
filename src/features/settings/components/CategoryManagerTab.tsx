import React, { useState } from "react"
import { useObligationsStore } from "@/features/obligations/store/obligationsSlice"
import { CATEGORY_PALETTE } from "@/features/obligations/constants/categories"
import type { Category } from "@/shared/types/domain"

export const CategoryManagerTab: React.FC = () => {
  const { categories, obligations, addCategory, updateCategory, deleteCategory } =
    useObligationsStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [colorInput, setColorInput] = useState("emerald")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
    setSuccessMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNameInput("")
    setColorInput("emerald")
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = nameInput.trim()

    if (!trimmedName) {
      setErrorMessage("El nombre de la categoría no puede estar vacío.")
      return
    }

    // Check for duplicate name (case-insensitive) except if editing same
    const duplicate = categoryList.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingId
    )
    if (duplicate) {
      setErrorMessage("Ya existe una categoría con este nombre.")
      return
    }

    if (editingId) {
      updateCategory(editingId, {
        name: trimmedName,
        color: colorInput,
      })
      setSuccessMessage(`Categoría "${trimmedName}" actualizada exitosamente.`)
      handleCancelEdit()
    } else {
      addCategory({
        name: trimmedName,
        color: colorInput,
      })
      setSuccessMessage(`Categoría "${trimmedName}" creada exitosamente.`)
      setNameInput("")
      setColorInput("emerald")
      setErrorMessage(null)
    }
  }

  const handleDelete = (categoryId: string) => {
    const cat = categories[categoryId]
    const count = getUsageCount(categoryId)
    if (count > 0) {
      setErrorMessage(
        `No se puede eliminar la categoría "${cat?.name || categoryId}" porque está en uso por ${count} obligación(es) activa(s).`
      )
      setSuccessMessage(null)
      return
    }

    deleteCategory(categoryId)
    if (editingId === categoryId) {
      handleCancelEdit()
    }
    setSuccessMessage(`Categoría eliminada exitosamente.`)
    setErrorMessage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🏷️</span> Mantenedor de Categorías
        </h3>
        <p className="text-xs text-slate-400">
          Administra las categorías de clasificación para tus ingresos y obligaciones financieras.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex justify-between items-center"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Cerrar mensaje de error"
            className="text-rose-400 hover:text-rose-200 ml-2 min-h-[36px] min-w-[36px] p-2 flex items-center justify-center rounded-lg hover:bg-rose-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition cursor-pointer"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex justify-between items-center"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Cerrar mensaje de confirmación"
            className="text-emerald-400 hover:text-emerald-200 ml-2 min-h-[36px] min-w-[36px] p-2 flex items-center justify-center rounded-lg hover:bg-emerald-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition cursor-pointer"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}

      {/* Category Create/Edit Card Form */}
      <form onSubmit={handleSave} className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-200">
            {editingId ? "✏️ Editar Categoría" : "➕ Nueva Categoría"}
          </span>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-slate-400 hover:text-slate-200 min-h-[32px] px-2 flex items-center"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-6">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Nombre de la categoría
            </label>
            <input
              type="text"
              placeholder="Ej. Gimnasio, Mascotas, Streaming"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full min-h-[44px] px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Color de identificación
            </label>
            <div className="flex gap-1.5 flex-wrap items-center min-h-[44px]">
              {Object.entries(CATEGORY_PALETTE).map(([key, opt]) => (
                <button
                  key={key}
                  type="button"
                  title={opt.label}
                  aria-label={`Seleccionar color ${opt.label}`}
                  onClick={() => setColorInput(key)}
                  className={`min-h-[32px] min-w-[32px] w-8 h-8 rounded-full ${opt.dotClass} cursor-pointer transition ${
                    colorInput === key
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs sm:text-sm font-semibold text-white cursor-pointer shadow transition"
            >
              {editingId ? "Guardar" : "Agregar"}
            </button>
          </div>
        </div>
      </form>

      {/* Category List */}
      <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 flex justify-between items-center">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Categorías Disponibles ({categoryList.length})
          </span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {categoryList.map((cat) => {
            const usageCount = getUsageCount(cat.id)
            const colorOption = CATEGORY_PALETTE[cat.color] || CATEGORY_PALETTE.emerald

            return (
              <div
                key={cat.id}
                data-testid={`category-row-${cat.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-800/20 transition"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-3.5 h-3.5 rounded-full ${colorOption?.dotClass} flex-shrink-0`} />
                  <div>
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                    <div className="text-[11px] text-slate-400">
                      {usageCount} {usageCount === 1 ? "obligación asociada" : "obligaciones asociadas"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(cat)}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition border border-slate-700"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
                    title={
                      usageCount > 0
                        ? `No se puede eliminar porque está en uso (${usageCount} obligaciones)`
                        : "Eliminar categoría"
                    }
                    className={`min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition ${
                      usageCount > 0
                        ? "bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed"
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
    </div>
  )
}
