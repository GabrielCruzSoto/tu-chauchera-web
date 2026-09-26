import React, { useState } from "react"
import { CategoryManagerTab } from "./CategoryManagerTab"
import { UserProfileTab } from "./UserProfileTab"
import { DataStorageTab } from "./DataStorageTab"
import { SupportTab } from "./SupportTab"

type SettingsTab = "categories" | "profile" | "storage" | "support"

export interface SettingsViewProps {
  onOpenPrivacy?: (() => void) | undefined
  onOpenTerms?: (() => void) | undefined
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenPrivacy, onOpenTerms }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("categories")

  const tabs = [
    { id: "categories", label: "🏷️ Categorías" },
    { id: "profile", label: "👤 Usuario & Preferencias" },
    { id: "storage", label: "💾 Almacenamiento & Bóveda" },
    { id: "support", label: "💬 Soporte & Ayuda" },
  ] as const

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>⚙️</span> Configuración & Bóveda
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Gestiona categorías, preferencias regionales, almacenamiento y seguridad de tus finanzas.
          </p>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === "categories" && <CategoryManagerTab />}
        {activeTab === "profile" && <UserProfileTab />}
        {activeTab === "storage" && <DataStorageTab />}
        {activeTab === "support" && <SupportTab onOpenPrivacy={onOpenPrivacy} onOpenTerms={onOpenTerms} />}
      </div>
    </div>
  )
}
