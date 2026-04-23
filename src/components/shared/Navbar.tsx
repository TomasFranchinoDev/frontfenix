"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, Menu, Search, ShoppingBag, X } from "lucide-react"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { cn } from "@/src/lib/utils"
import { supabase } from "@/src/lib/supabase/client"
import { useAuthStore } from "@/src/stores/authStore"
import { useCartStore } from "@/src/stores/cartStore"
import { useCatalogStore } from "@/src/stores/catalogStore"

function CartCount() {
  const itemCount = useCartStore((state) => state.getItemCount())
  const hasHydrated = useCartStore((state) => state.hasHydrated)

  // Siempre devolvemos algo, sin early returns antes de hooks
  if (!hasHydrated) {
    return <span className="text-xs font-bold">0</span>
  }

  return <span className="text-xs font-bold">{itemCount}</span>
}

function getProfileInitials(fullName: string | undefined) {
  if (!fullName) {
    return "MI"
  }

  const tokens = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) {
    return "MI"
  }

  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase()
  }

  return `${tokens[0][0]}${tokens[1][0]}`.toUpperCase()
}

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/cuenta/mis-ordenes", label: "Mis ordenes" },
]

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const [currentQuery, setCurrentQuery] = useState("")

  const setSearchQuery = useCatalogStore((state) => state.setSearchQuery)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const nextQuery = new URLSearchParams(window.location.search).get("q") ?? ""
    setCurrentQuery(nextQuery)
  }, [pathname])

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const searchValue = formData.get("q") as string
    const trimmed = searchValue.trim()
    setSearchQuery(trimmed)
    if (trimmed) {
      router.push(`/catalogo?q=${encodeURIComponent(trimmed)}`)
    } else {
      router.push("/catalogo")
    }
  }

  const session = useAuthStore((state) => state.session)
  const profile = useAuthStore((state) => state.profile)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const setSession = useAuthStore((state) => state.setSession)
  const fetchProfile = useAuthStore((state) => state.fetchProfile)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  useEffect(() => {
    if (!isInitialized) {
      void initializeAuth()
    }
  }, [initializeAuth, isInitialized])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession)

      if (nextSession) {
        await fetchProfile()
      } else {
        clearAuth()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [clearAuth, fetchProfile, setSession])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return
      }

      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    setIsMenuOpen(false)
    await supabase.auth.signOut()
    clearAuth()
    router.push("/")
  }

  const profileLabel = getProfileInitials(profile?.nombre_completo)
  const userMetadata = session?.user?.user_metadata as Record<string, unknown> | undefined
  const profileAvatarUrl =
    (typeof userMetadata?.avatar_url === "string" && userMetadata.avatar_url) ||
    (typeof userMetadata?.picture === "string" && userMetadata.picture) ||
    null
  const profileTitle = profile?.nombre_completo?.trim() || `Mi cuenta (${profileLabel})`

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-12">
          {/* Hamburger Menu Button (Mobile/Tablet) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden shrink-0 text-foreground"
            aria-label="Abrir menú"
          >
            <Menu className="size-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="font-display text-lg font-bold px-4 tracking-tight text-foreground shrink-0 mx-auto lg:mx-0">
            Fenix Envases
          </Link>

          {/* Navigation links - desktop */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search bar - desktop */}
          <div className="hidden flex-1 mx-6 lg:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={currentQuery}
                key={`desktop-search-${currentQuery}`}
                placeholder="Buscar soluciones de empaque"
                className="h-10 w-full rounded-full border border-outline-variant bg-surface-container-low pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25"
              />
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Auth button / User menu */}
            {session ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-container hover:text-foreground"
                  title={profileTitle}
                >
                  <Avatar className="size-6 ring-1 ring-outline-variant">
                    {profileAvatarUrl ? (
                      <AvatarImage src={profileAvatarUrl} alt={`Avatar de ${profileTitle}`} width={24} height={24} />
                    ) : null}
                    <AvatarFallback className="text-[10px] bg-surface-container-high">{profileLabel}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className={cn("size-3.5 transition-transform", isMenuOpen ? "rotate-180" : "rotate-0")} />
                </button>

                {isMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-outline-variant bg-white p-1.5 shadow-lg"
                  >
                    <Link
                      href="/mi-perfil"
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-surface-container"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Mi Perfil
                    </Link>
                    <Link
                      href="/cuenta/mis-ordenes"
                      role="menuitem"
                      className="block rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-surface-container"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Mis compras
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="block w-full rounded-lg px-3 py-2 text-left text-sm text-foreground transition hover:bg-surface-container"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:block"
              >
                Iniciar Sesión
              </Link>
            )}

            {/* Cart button - icon style */}
            <Link
              href="/carrito"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#c49314] text-white transition-colors hover:bg-[#a87c10]"
              aria-label="Carrito de compras"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#c49314] text-[8px] font-bold text-white ring-2 ring-[#c49314]">
                <CartCount />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-100 bg-white lg:hidden overflow-y-auto">
          <div className="flex h-16 items-center justify-between border-b border-outline-variant px-6">
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Fenix Envases
            </span>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground"
              aria-label="Cerrar menú"
            >
              <X className="size-6" />
            </button>
          </div>

          <div className="flex flex-col p-6 space-y-8">
            {/* Mobile Search */}
            <form onSubmit={(e) => {
              handleSearchSubmit(e)
              setIsMobileMenuOpen(false)
            }} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                name="q"
                defaultValue={currentQuery}
                key={`mobile-search-${currentQuery}`}
                placeholder="Buscar soluciones de empaque"
                className="h-12 w-full rounded-full border border-outline-variant bg-surface-container-low pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25"
              />
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "text-lg font-medium py-2 border-b border-outline-variant/50 transition-colors",
                    isActive(link.href)
                      ? "font-bold text-primary"
                      : "text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth */}
            {!session && (
              <div className="pt-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-full bg-primary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#a87c10]"
                >
                  Iniciar Sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
