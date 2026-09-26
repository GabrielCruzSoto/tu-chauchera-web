import React, { useState, useEffect } from "react"
import { PRIVACY_POLICY_MD } from "../content/privacyPolicyContent"

interface PrivacyPolicyPageProps {
  onBack?: (() => void) | undefined
  onNavigateToTerms?: (() => void) | undefined
}

interface TableOfContentItem {
  id: string
  title: string
}

const TOC_ITEMS: TableOfContentItem[] = [
  { id: "seccion-1", title: "1. Introducción y Responsable" },
  { id: "seccion-2", title: "2. Datos Personales Recopilados" },
  { id: "seccion-3", title: "3. Finalidades del Tratamiento" },
  { id: "seccion-4", title: "4. Base Legal del Tratamiento" },
  { id: "seccion-5", title: "5. Arquitectura Técnica y Seguridad" },
  { id: "seccion-6", title: "6. Transferencia y Divulgación" },
  { id: "seccion-7", title: "7. Cookies y Almacenamiento Local" },
  { id: "seccion-8", title: "8. Derechos del Titular (ARCO)" },
  { id: "seccion-9", title: "9. Privacidad de Menores" },
  { id: "seccion-10", title: "10. Modificaciones a la Política" },
  { id: "seccion-11", title: "11. Canal de Contacto y Dudas" },
]

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack, onNavigateToTerms }) => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("seccion-1")

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    document.title = "Política de Privacidad — Tu Chauchera"
    return () => {
      document.title = "Tu Chauchera — Finanzas Personales"
    }
  }, [])

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/privacidad` : "https://tu-chauchera.cl/privacidad"
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleDownloadMarkdown = () => {
    const blob = new Blob([PRIVACY_POLICY_MD], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "POLITICA_DE_PRIVACIDAD_TU_CHAUCHERA.md"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const elem = document.getElementById(id)
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  // Renders inline formatted text: bold, code, links
  const renderInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g)
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-semibold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/80 text-emerald-300 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
      if (linkMatch && linkMatch[1] && linkMatch[2]) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
          >
            {linkMatch[1]}
          </a>
        )
      }
      return part
    })
  }

  // Parses and renders markdown blocks cleanly
  const renderContent = () => {
    const lines = PRIVACY_POLICY_MD.split("\n")
    const elements: React.ReactNode[] = []
    let currentQuote: string[] = []
    let inQuote = false
    let currentList: string[] = []
    let inList = false
    let listType: "ul" | "ol" = "ul"
    let sectionCounter = 0

    const flushQuote = (key: string) => {
      if (!inQuote || currentQuote.length === 0) return
      const fullText = currentQuote.join(" ")
      const isWarning = fullText.includes("⚠️") || fullText.includes("DECLARACIÓN EXPRESA")
      const isDanger = fullText.includes("🚫") || fullText.includes("PROHIBICIÓN ESTRICTA")

      elements.push(
        <div
          key={key}
          className={`my-5 p-4 sm:p-5 rounded-2xl border text-sm leading-relaxed ${
            isWarning
              ? "bg-amber-950/20 border-amber-500/30 text-amber-200/90 shadow-lg shadow-amber-950/20"
              : isDanger
              ? "bg-rose-950/20 border-rose-500/30 text-rose-200/90 shadow-lg shadow-rose-950/20"
              : "bg-slate-900/60 border-slate-800 text-slate-300"
          }`}
        >
          {renderInline(fullText)}
        </div>
      )
      currentQuote = []
      inQuote = false
    }

    const flushList = (key: string) => {
      if (!inList || currentList.length === 0) return
      if (listType === "ul") {
        elements.push(
          <ul key={key} className="space-y-2.5 my-3 text-slate-300 text-sm leading-relaxed pl-1 sm:pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        )
      } else {
        elements.push(
          <ol key={key} className="space-y-2.5 my-3 text-slate-300 text-sm leading-relaxed pl-1 sm:pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-emerald-400 mt-0.5 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                  {idx + 1}
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        )
      }
      currentList = []
      inList = false
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      // Handle Blockquotes
      if (trimmed.startsWith(">")) {
        flushList(`list-before-quote-${index}`)
        inQuote = true
        currentQuote.push(trimmed.replace(/^>\s*/, ""))
        return
      } else if (inQuote) {
        flushQuote(`quote-${index}`)
      }

      // Handle Unordered Lists
      if (trimmed.startsWith("- ")) {
        if (inList && listType !== "ul") flushList(`list-switch-${index}`)
        inList = true
        listType = "ul"
        currentList.push(trimmed.slice(2))
        return
      }

      // Handle Ordered Lists (e.g. "1. ")
      const olMatch = trimmed.match(/^\d+\.\s+(.*)/)
      if (olMatch && olMatch[1]) {
        if (inList && listType !== "ol") flushList(`list-switch-ol-${index}`)
        inList = true
        listType = "ol"
        currentList.push(olMatch[1])
        return
      }

      // If we hit any non-list line, flush pending list
      if (inList) {
        flushList(`list-${index}`)
      }

      // Skip document title (rendered in page header)
      if (trimmed.startsWith("# ")) {
        return
      }

      // Horizontal rules
      if (trimmed === "---") {
        elements.push(<hr key={`hr-${index}`} className="border-slate-800/80 my-8" />)
        return
      }

      // H2 Headings (Main Sections)
      if (trimmed.startsWith("## ")) {
        sectionCounter++
        const sectionId = `seccion-${sectionCounter}`
        const headingText = trimmed.replace("## ", "")
        elements.push(
          <div key={`h2-${index}`} id={sectionId} className="scroll-mt-24 pt-6 pb-2 border-b border-slate-800/60 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span className="w-2 h-6 rounded-full bg-emerald-500 inline-block shrink-0" />
              <span>{headingText}</span>
            </h2>
          </div>
        )
        return
      }

      // H3 Headings (Subsections)
      if (trimmed.startsWith("### ")) {
        const headingText = trimmed.replace("### ", "")
        elements.push(
          <h3 key={`h3-${index}`} className="text-base sm:text-lg font-semibold text-slate-100 mt-6 mb-2.5">
            {headingText}
          </h3>
        )
        return
      }

      // Metadata bullet / general text
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${index}`} className="text-sm text-slate-300 leading-relaxed my-2.5">
            {renderInline(trimmed)}
          </p>
        )
      }
    })

    flushQuote("quote-end")
    flushList("list-end")

    return elements
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Ambient Lighting Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-teal-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[32rem] h-[32rem] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                aria-label="Volver a la aplicación"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver</span>
              </button>
            ) : (
              <a
                href="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 transition"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Inicio</span>
              </a>
            )}

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">Tu Chauchera</span>
              <span className="text-xs text-slate-400">/ Legal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToTerms ? (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-300 transition cursor-pointer"
              >
                <span>Condiciones del Servicio</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <a
                href="/terminos"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-300 transition"
              >
                <span>Condiciones del Servicio</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            )}

            <button
              type="button"
              onClick={() => void handleCopyLink()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
              title="Copiar enlace directo"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{copiedLink ? "✓ Copiado" : "Copiar Enlace"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadMarkdown}
              aria-label="Descargar documento en Markdown (.md)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/40 text-xs font-semibold text-white transition cursor-pointer shadow-sm shadow-emerald-950"
              title="Descargar documento en Markdown (.md)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Descargar .md</span>
              <span className="sm:hidden">.md</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        {/* Document Hero */}
        <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden md:block">
            <svg className="w-48 h-48 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Vigente (v1.0.0)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 text-xs">
                Local-First & Zero-Backend
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/80 text-xs">
                Cifrado AES-256-GCM
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Política de Privacidad de Tu Chauchera
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              En Tu Chauchera tu información financiera te pertenece única y exclusivamente a ti. Operamos bajo el principio
              de <strong>Privacidad por Diseño</strong>: no tenemos servidores de base de datos propios, no almacenamos tus contraseñas
              y tus datos se guardan cifrados directamente en tu dispositivo y en tu cuenta personal de Google Drive.
            </p>
          </div>
        </div>

        {/* 2-Column Grid: TOC + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/90 backdrop-blur-md space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📑</span> Índice de Cláusulas
              </h3>
              <nav className="space-y-1">
                {TOC_ITEMS.map((item) => {
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-2" />}
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <span>🛡️</span> Soberanía del Dato
              </p>
              <p className="leading-relaxed">
                Puedes revocar el acceso a Tu Chauchera o eliminar todos tus datos en cualquier momento desde tu cuenta de Google.
              </p>
            </div>
          </aside>

          {/* Right: Rendered Markdown Content */}
          <article className="lg:col-span-8 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 lg:p-10 backdrop-blur-xl shadow-xl shadow-slate-950/40 space-y-2">
            {renderContent()}
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500 bg-slate-950 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Tu Chauchera. Proyecto de software libre y descentralizado.</p>
          <div className="flex items-center gap-4">
            {onNavigateToTerms ? (
              <button
                type="button"
                onClick={onNavigateToTerms}
                className="hover:text-emerald-400 transition cursor-pointer"
              >
                Condiciones del Servicio
              </button>
            ) : (
              <a href="/terminos" className="hover:text-emerald-400 transition">
                Condiciones del Servicio
              </a>
            )}
            <span>•</span>
            <a href="mailto:tuchaucheracl@gmail.com" className="hover:text-emerald-400 transition">
              Contacto Legal
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
