import React, { useState, useEffect } from "react"
import { TERMS_OF_SERVICE_MD } from "../content/termsOfServiceContent"

interface TermsOfServicePageProps {
  onBack?: (() => void) | undefined
  onNavigateToPrivacy?: (() => void) | undefined
}

interface TableOfContentItem {
  id: string
  title: string
}

const TOC_ITEMS: TableOfContentItem[] = [
  { id: "seccion-1", title: "1. Aceptación de Términos" },
  { id: "seccion-2", title: "2. Identidad del Titular" },
  { id: "seccion-3", title: "3. Modelo Local-First & Zero-Backend" },
  { id: "seccion-4", title: "4. Descargo Financiero" },
  { id: "seccion-5", title: "5. Autenticación y Seguridad" },
  { id: "seccion-6", title: "6. Bóveda Criptográfica" },
  { id: "seccion-7", title: "7. Licencia y Propiedad" },
  { id: "seccion-8", title: "8. Conductas Prohibidas" },
  { id: "seccion-9", title: "9. Exclusión de Responsabilidad" },
  { id: "seccion-10", title: "10. Servicios de Terceros" },
  { id: "seccion-11", title: "11. Modificaciones al Servicio" },
  { id: "seccion-12", title: "12. Suspensión y Cierre" },
  { id: "seccion-13", title: "13. Ley y Jurisdicción" },
  { id: "seccion-14", title: "14. Misceláneos" },
  { id: "seccion-15", title: "15. Canal de Contacto" },
]

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack, onNavigateToPrivacy }) => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("seccion-1")

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
    document.title = "Condiciones del Servicio — Tu Chauchera"
    return () => {
      document.title = "Tu Chauchera — Finanzas Personales"
    }
  }, [])

  const handleCopyLink = async () => {
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/terminos` : "https://tu-chauchera.cl/terminos"
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Clipboard fallback
    }
  }

  const handleDownloadMarkdown = () => {
    const blob = new Blob([TERMS_OF_SERVICE_MD], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "CONDICIONES_DEL_SERVICIO_TU_CHAUCHERA.md"
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
        const isInternal = linkMatch[2].startsWith("/") || linkMatch[2].startsWith("#")
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            onClick={
              linkMatch[2] === "/privacidad" && onNavigateToPrivacy
                ? (e) => {
                    e.preventDefault()
                    onNavigateToPrivacy()
                  }
                : undefined
            }
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
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
    const lines = TERMS_OF_SERVICE_MD.split("\n")
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
      const isWarning = fullText.includes("⚠️") || fullText.includes("ADVERTENCIA") || fullText.includes("DECLARACIÓN EXPRESA")
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

      // Flush pending lists on normal lines
      if (inList) {
        flushList(`list-${index}`)
      }

      // Skip document title (rendered in page hero)
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

      // Paragraph text
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
            {/* Legal Toggle Tabs */}
            {onNavigateToPrivacy ? (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-300 transition cursor-pointer"
              >
                <span>Política de Privacidad</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <a
                href="/privacidad"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-emerald-300 transition"
              >
                <span>Política de Privacidad</span>
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
            <svg className="w-48 h-48 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                Vigente (v1.0.0)
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                Local-First & Zero-Backend
              </span>
              <span className="px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium">
                Sin Intermediación Financiera
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                Legislación Chilena
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Condiciones del Servicio y Términos de Uso
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Normas que regulan el acceso, licencias, responsabilidades y uso de <strong>Tu Chauchera</strong>. Software independiente de finanzas personales diseñado con arquitectura de conocimiento cero.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 font-mono">
              <div>
                <span className="text-slate-500">Última actualización: </span>
                <span className="text-slate-200">25 de septiembre de 2026</span>
              </div>
              <div>
                <span className="text-slate-500">Titular: </span>
                <span className="text-slate-200">Gabriel Cruz Soto</span>
              </div>
              <div>
                <span className="text-slate-500">Contacto: </span>
                <a href="mailto:tuchaucheracl@gmail.com" className="text-emerald-400 hover:underline">
                  tuchaucheracl@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: TOC + Document Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Navigation: Table of Contents */}
          <aside className="lg:col-span-4 sticky top-24 space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span>Índice del Documento</span>
              </div>

              <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                {TOC_ITEMS.map((item) => {
                  const isActive = activeSection === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer flex items-center justify-between gap-2 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <span className="truncate">{item.title}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
                    </button>
                  )
                })}
              </nav>

              <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Descargar Copia (.md)</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Legal Document Content */}
          <article className="lg:col-span-8 p-6 sm:p-10 rounded-3xl bg-slate-900/40 border border-slate-800 backdrop-blur-md shadow-xl space-y-2">
            {renderContent()}
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Tu Chauchera. Proyecto de software libre y descentralizado.</p>
          <div className="flex items-center gap-4">
            {onNavigateToPrivacy ? (
              <button
                type="button"
                onClick={onNavigateToPrivacy}
                className="hover:text-emerald-400 transition cursor-pointer"
              >
                Política de Privacidad
              </button>
            ) : (
              <a href="/privacidad" className="hover:text-emerald-400 transition">
                Política de Privacidad
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
