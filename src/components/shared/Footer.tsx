import Link from "next/link"

const footerLinks = [
  { href: "#", label: "Aviso de Privacidad" },
  { href: "#", label: "Sustentabilidad" },
  { href: "#", label: "Proyectos" },
  { href: "#", label: "Contacto" },
]

export function Footer() {
  return (
    <footer className="w-full bg-[#1a1a1a] px-6 py-10 md:px-12 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Logo */}
        <div className="font-display text-lg font-bold text-white">
          Fenix
          <br />
          <span className="text-white/70">Envases</span>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-8">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[11px] uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <div className="text-[11px] uppercase tracking-[0.12em] text-white/40">
          © 2026 Fenix Envases.
          <br className="hidden md:inline" />
          {" "}Packaging.
        </div>
      </div>
    </footer>
  )
}
