"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Boxes,
  FileText,
  Layers3,
  LogOut,
  Menu,
  Plus,
  Search,
  Truck,
} from "lucide-react"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar"
import { useLogout } from "@/src/hooks/useLogout"
import { cn } from "@/src/lib/utils"
import api from "@/src/lib/api/client"
import { useAuthStore } from "@/src/stores/authStore"

type AdminShellProps = {
  children: React.ReactNode
}

type AdminSearchOrderResult = {
  id: string
  codigo_orden: string
  cliente_nombre: string
  cliente_empresa: string
  estado: string
}

type AdminSearchProductResult = {
  id: string
  nombre: string
  sku: string | null
  activo: boolean
}

type AdminSearchResponse = {
  ordenes: AdminSearchOrderResult[]
  productos: AdminSearchProductResult[]
}

const navItems = [
  { key: "dashboard", href: "/admin", label: "Panel principal", icon: Layers3 },
  { key: "cotizaciones", href: "/admin/ordenes", label: "Cotizaciones", icon: FileText },
  { key: "contenidos", href: "/admin/productos", label: "Productos", icon: Layers3 },
  { key: "envios", href: "/admin/ordenes?vista=envios", label: "Envios", icon: Truck },
] as const

function initials(fullName?: string) {
  const base = (fullName ?? "").trim()
  if (!base) return "FE"
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [currentVista, setCurrentVista] = useState("")
  const [missingRoleCheckedForSession, setMissingRoleCheckedForSession] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<AdminSearchResponse>({ ordenes: [], productos: [] })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState("")

  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  const isLoading = useAuthStore((s) => s.isLoading)
  const initializeAuth = useAuthStore((s) => s.initializeAuth)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const avatarLabel = initials(profile?.nombre_completo)
  const logout = useLogout({ redirectTo: "/login" })

  // Initialize auth if not done yet
  useEffect(() => {
    if (!isInitialized) {
      void initializeAuth()
    }
  }, [isInitialized, initializeAuth])

  // Redirect to /login if no session after auth is initialized
  useEffect(() => {
    if (!isInitialized || isLoading) {
      setAuthChecked(false)
      return
    }

    let cancelled = false

    const verifyAdminAccess = async () => {
      if (!session) {
        router.push("/login")
        return
      }

      let resolvedProfile = profile
      let retries = 0
      const maxRetries = 3

      while (!resolvedProfile && retries < maxRetries) {
        resolvedProfile = await fetchProfile()
        if (!resolvedProfile) {
          retries++
          if (retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      if (cancelled) {
        return
      }

      if (!resolvedProfile) {
        // Still no profile after retries, might be a network error or missing profile
        return
      }

      if (typeof resolvedProfile.es_admin !== "boolean") {
        if (missingRoleCheckedForSession !== session.user.id) {
          setMissingRoleCheckedForSession(session.user.id)
          resolvedProfile = await fetchProfile()
        }
      } else if (missingRoleCheckedForSession !== null) {
        setMissingRoleCheckedForSession(null)
      }

      if (cancelled || !resolvedProfile) {
        return
      }

      if (typeof resolvedProfile.es_admin !== "boolean") {
        console.warn("[AdminShell] Admin role still unavailable after profile fetch", {
          sessionUserId: session.user.id,
          profile: resolvedProfile,
        })
        return
      }

      if (!resolvedProfile.es_admin) {
        console.log("[AdminShell] Redirecting non-admin user from /admin", {
          sessionUserId: session.user.id,
          profile: resolvedProfile,
        })
        router.push("/")
        return
      }

      setAuthChecked(true)
    }

    void verifyAdminAccess()

    return () => {
      cancelled = true
    }
  }, [isInitialized, isLoading, session, profile, fetchProfile, router, missingRoleCheckedForSession])

  const handleLogout = async () => {
    setMobileOpen(false)
    await logout()
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const vista = new URLSearchParams(window.location.search).get("vista") ?? ""
    setCurrentVista(vista)
  }, [pathname])

  const activeKey = useMemo(() => {
    if (!pathname) return "dashboard"
    if (pathname.startsWith("/admin/productos")) return "contenidos"
    if (pathname.startsWith("/admin/ordenes") && currentVista === "envios") return "envios"
    if (pathname.startsWith("/admin/ordenes")) return "cotizaciones"
    return "dashboard"
  }, [pathname, currentVista])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  useEffect(() => {
    const trimmed = searchQuery.trim()
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(trimmed)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [searchQuery])

  useEffect(() => {
    const controller = new AbortController()

    if (debouncedSearchQuery.length < 2) {
      setSearchResults({ ordenes: [], productos: [] })
      setSearchLoading(false)
      setSearchError("")
      return () => controller.abort()
    }

    const searchAdmin = async () => {
      setSearchLoading(true)
      setSearchError("")

      try {
        const { data } = await api.get<AdminSearchResponse>("/api/admin/search", {
          params: { q: debouncedSearchQuery },
          signal: controller.signal,
        })
        setSearchResults(data)
        setSearchOpen(true)
      } catch (error) {
        if (!isAbortError(error)) {
          setSearchResults({ ordenes: [], productos: [] })
          setSearchError("No pudimos buscar ahora mismo.")
          setSearchOpen(true)
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false)
        }
      }
    }

    void searchAdmin()

    return () => controller.abort()
  }, [debouncedSearchQuery])

  useEffect(() => {
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
    }
  }, [])

  const totalResults = searchResults.ordenes.length + searchResults.productos.length

  const navigateFromSearch = (href: string) => {
    setSearchOpen(false)
    setSearchQuery("")
    setDebouncedSearchQuery("")
    setSearchResults({ ordenes: [], productos: [] })
    setSearchError("")
    router.push(href)
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const firstOrder = searchResults.ordenes[0]
    if (firstOrder) {
      navigateFromSearch(`/admin/ordenes/${firstOrder.id}`)
      return
    }

    const firstProduct = searchResults.productos[0]
    if (firstProduct) {
      navigateFromSearch(`/admin/productos/${firstProduct.id}`)
    }
  }

  // Don't render admin until auth is verified
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Verificando acceso...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
            aria-label="Cerrar menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[min(92vw,320px)] bg-sidebar p-4 shadow-xl">
            <Sidebar activeKey={activeKey} onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-foreground/8 bg-sidebar lg:block">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-7">
            <Sidebar activeKey={activeKey} onLogout={handleLogout} />
          </div>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-foreground/10 bg-surface-light/90 backdrop-blur">
            <div className="mx-auto flex h-20 w-full max-w-310 items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="size-4" />
                </Button>
                <div ref={searchRef} className="relative w-full min-w-55 max-w-lg">
                  <form onSubmit={handleSearchSubmit}>
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onFocus={() => {
                        if (searchQuery.trim().length >= 2 || totalResults > 0 || searchError) {
                          setSearchOpen(true)
                        }
                      }}
                      className="h-12 rounded-lg border-foreground/20 bg-surface-container pl-10"
                      placeholder="Buscar órdenes o productos..."
                      aria-label="Buscar órdenes o productos"
                    />
                  </form>

                  {searchOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-[0_18px_45px_rgba(24,22,17,0.14)]">
                      <div className="border-b border-foreground/8 px-4 py-3 text-xs text-muted-foreground">
                        {searchLoading
                          ? "Buscando..."
                          : debouncedSearchQuery.length < 2
                            ? "Escribe al menos 2 caracteres."
                            : totalResults > 0
                              ? `${totalResults} resultado${totalResults === 1 ? "" : "s"}`
                              : searchError || "Sin resultados"}
                      </div>

                      {searchResults.ordenes.length > 0 ? (
                        <div className="border-b border-foreground/8 px-2 py-2 last:border-b-0">
                          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Órdenes
                          </p>
                          <div className="space-y-1">
                            {searchResults.ordenes.map((order) => {
                              const clientLabel = order.cliente_empresa || order.cliente_nombre || "Cliente sin nombre"
                              return (
                                <button
                                  key={order.id}
                                  type="button"
                                  onClick={() => navigateFromSearch(`/admin/ordenes/${order.id}`)}
                                  className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-container-low"
                                >
                                  <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                                    <FileText className="size-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-foreground">{order.codigo_orden}</span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                      {clientLabel} · {formatOrderStateLabel(order.estado)}
                                    </span>
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}

                      {searchResults.productos.length > 0 ? (
                        <div className="px-2 py-2">
                          <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Productos
                          </p>
                          <div className="space-y-1">
                            {searchResults.productos.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => navigateFromSearch(`/admin/productos/${product.id}`)}
                                className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-container-low"
                              >
                                <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                                  <Boxes className="size-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-foreground">{product.nombre}</span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {product.sku || "Sin SKU"} · {product.activo ? "Activo" : "Inactivo"}
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="hidden items-center gap-7 lg:flex">
                <div className="flex items-center gap-5 text-sm text-muted-foreground">
                  <Link href="/admin" className="border-b-2 border-primary pb-1 font-semibold text-primary">
                    Panel
                  </Link>
                  <Link href="/admin/ordenes" className="transition hover:text-foreground">
                    Cotizaciones
                  </Link>
                </div>

                <Avatar className="border border-foreground/10">
                  <AvatarFallback>{avatarLabel}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-9">{children}</div>
          <p className="px-4 pb-6 text-center text-[11px] text-muted-foreground sm:px-6 lg:px-9">
           © 2026 Fenix Envases. Todos los derechos reservados.
          </p>
        </main>
      </div>

      <Button
        asChild
        size="icon"
        className="fixed bottom-5 right-5 z-30 rounded-full shadow-[0_14px_35px_rgba(138,103,0,0.35)] lg:bottom-7 lg:right-7"
      >
        <Link href="/admin/productos/nuevo" aria-label="Nueva cotización">
          <Plus className="size-5" />
        </Link>
      </Button>
    </div>
  )
}

function formatOrderStateLabel(state: string) {
  const stateMap: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PREPARACION: "En preparación",
    LISTO: "Listo",
    DESPACHADO: "Despachado",
    CANCELADA: "Cancelada",
  }

  return stateMap[state] ?? state
}

function isAbortError(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false
  }

  const maybeError = error as { name?: string; code?: string }
  return maybeError.name === "CanceledError" || maybeError.name === "AbortError" || maybeError.code === "ERR_CANCELED"
}

function Sidebar({ activeKey, onNavigate, onLogout }: { activeKey: string; onNavigate?: () => void; onLogout?: () => void }) {
  return (
    <>
      <div className="mb-10 px-2">
        <h1 className="font-display text-[1.72rem] leading-none text-white">Fenix Admin</h1>
        <p className="mt-1 text-xs text-muted-foreground">Panel de administración</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeKey === item.key
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isActive
                  ? "bg-surface-light text-foreground ring-1 ring-primary/30"
                  : "text-muted-foreground hover:bg-surface-container-low hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </span>
              {isActive ? <span className="h-8 w-1.5 rounded-full bg-primary" /> : null}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 space-y-2">
        <Button asChild className="w-full justify-center rounded-full">
          <Link href="/admin/productos/nuevo" onClick={onNavigate}>
            <Plus className="size-4" />
            Nueva Cotización
          </Link>
        </Button>

        <div className="pt-5">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )
}

// Modified for retry fetchProfile

