"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import UserButton from "../components/UserButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [storeName, setStoreName] = useState("Minha Loja Principal");
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Verificação de segurança: Checa se o usuário tem o token ao carregar a página
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    } else {
      setIsAuthorized(true);
      try {
        const payloadBase64 = token.split(".")[1];
        const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
        const payload = JSON.parse(decodedJson);
        const slug = payload.tenantSlug || localStorage.getItem("tenant_slug");
        if (slug) {
          setStoreSlug(slug);
          setStoreName(slug.charAt(0).toUpperCase() + slug.slice(1) + " Store");
        }
      } catch {
        // Usa o valor padrão
      }
    }

    setIsMobileMenuOpen(false);
  }, [pathname, router]);

  // Enquanto verifica o login, mostra tela de carregamento elegante no tema Obsidian Orbit
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-outline gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="font-label-md text-label-md">Autenticando CentralCart...</span>
      </div>
    );
  }

  const navItems = [
    { name: "Visão Geral", href: "/admin", icon: "dashboard" },
    { name: "Produtos", href: "/admin/produtos", icon: "inventory_2" },
    { name: "Pedidos", href: "/admin/pedidos", icon: "shopping_cart" },
    { name: "Clientes", href: "/admin/clientes", icon: "group" },
    { name: "Pagamentos", href: "/admin/pagamentos", icon: "payments" },
  ];

  const secondaryNavItems = [
    { name: "Configurações", href: "/admin/configuracoes", icon: "settings" },
    { name: "Ajuda", href: "/admin/configuracoes", icon: "help" },
  ];

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen antialiased selection:bg-primary-container selection:text-on-primary-container overflow-x-hidden">
      {/* ───────────────────────────────────────────────────────────
          1. SIDEBAR DESKTOP (FIXA 260px / w-64)
      ──────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-surface-container-high/40 z-50 flex-col justify-between py-space-md">
        <div className="flex flex-col gap-space-lg">
          {/* Logo CentralCart */}
          <div className="px-space-md flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-space-sm group">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-[0_2px_12px_rgba(160,120,255,0.4)] group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-xl">shopping_bag</span>
              </div>
              <span className="font-headline-md text-headline-md tracking-tight text-on-surface">
                CentralCart
              </span>
            </Link>
          </div>

          {/* Loja Ativa Dropdown / Botão */}
          <div className="px-space-md">
            <button
              onClick={() => {
                if (storeSlug) {
                  window.open(`/loja/${storeSlug}`, "_blank");
                }
              }}
              title="Clique para abrir sua loja pública"
              className="w-full flex items-center justify-between px-space-md py-space-sm bg-surface-container-low hover:bg-surface-container hover:text-on-surface rounded-lg transition-colors text-left group"
            >
              <div className="flex items-center gap-space-sm min-w-0">
                <span className="material-symbols-outlined text-primary text-xl shrink-0">storefront</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-xs text-label-xs text-on-surface-variant truncate">
                    Loja Ativa
                  </span>
                  <span className="font-label-md text-label-md text-on-surface truncate group-hover:text-primary transition-colors">
                    {storeName}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline text-lg group-hover:text-primary shrink-0">
                open_in_new
              </span>
            </button>
          </div>

          {/* Navegação Principal */}
          <nav className="flex flex-col gap-space-xs px-space-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all font-label-md text-label-md ${
                    isActive
                      ? "bg-surface-container text-primary font-semibold shadow-sm ring-1 ring-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${isActive ? "text-primary" : "text-outline"}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.name}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(208,188,255,0.8)] shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="flex flex-col gap-space-xs px-space-sm">
          <nav className="flex flex-col gap-space-xs">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-space-md px-space-md py-space-sm rounded-lg transition-all font-label-md text-label-md ${
                    isActive
                      ? "bg-surface-container text-primary font-semibold"
                      : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl text-outline shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-space-sm pt-space-sm px-space-md flex items-center justify-between text-outline border-t border-surface-container-high/40">
            <span className="font-label-xs text-label-xs uppercase tracking-wider truncate">v2.4.0 • SaaS PRO</span>
            <span className="material-symbols-outlined text-base text-secondary shrink-0">shield</span>
          </div>
        </div>
      </aside>

      {/* ───────────────────────────────────────────────────────────
          2. MOBILE DRAWER (MENU LATERAL COMPLETO NO CELULAR)
      ──────────────────────────────────────────────────────────── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-surface-container-lowest border-r border-surface-container-high/40 flex flex-col justify-between py-space-md p-space-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-space-md">
              <div className="px-space-sm flex items-center justify-between">
                <div className="flex items-center gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                  </div>
                  <span className="font-headline-md text-on-surface">CentralCart</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
                  aria-label="Fechar menu"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="px-space-sm">
                <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high/40">
                  <span className="font-label-xs text-outline block">Loja Conectada</span>
                  <span className="font-label-md text-on-surface font-semibold truncate block">{storeName}</span>
                </div>
              </div>

              <nav className="flex flex-col gap-1 px-space-xs">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-surface-container text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low"
                  >
                    <span className="material-symbols-outlined text-lg">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="px-space-sm pt-space-md border-t border-surface-container-high/40 flex items-center justify-between text-outline">
              <span className="font-label-xs text-label-xs uppercase">v2.4.0 • SaaS PRO</span>
              <span className="material-symbols-outlined text-base text-secondary">shield</span>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          3. HEADER SUPERIOR DESKTOP + MOBILE
      ──────────────────────────────────────────────────────────── */}
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-surface-container-high/40 z-40 items-center justify-between px-space-lg">
        {/* Input de Busca com ⌘K */}
        <div className="flex items-center gap-space-md w-96">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar pedidos, produtos, clientes..."
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-body-sm font-body-sm pl-10 pr-14 py-space-sm rounded-lg outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container-low transition-all border border-surface-container-high/30"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
              <kbd className="bg-surface-container-high text-on-surface-variant font-label-xs text-label-xs px-1.5 py-0.5 rounded">
                ⌘
              </kbd>
              <kbd className="bg-surface-container-high text-on-surface-variant font-label-xs text-label-xs px-1.5 py-0.5 rounded">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Notificações e Perfil */}
        <div className="flex items-center gap-space-md">
          <button
            aria-label="Notificações"
            className="relative p-space-sm rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface"></span>
          </button>

          <div className="h-6 w-px bg-surface-container-highest"></div>

          <div className="flex items-center gap-space-sm pl-space-xs">
            <UserButton />
          </div>
        </div>
      </header>

      {/* Mobile Top Header (Otimizado para não quebrar) */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container-high/40 px-3 sm:px-4">
        <div className="h-full flex items-center justify-between gap-2 max-w-full">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors shrink-0"
              aria-label="Abrir menu"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 min-w-0">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse"></span>
                <span className="font-label-xs text-[10px] text-secondary truncate uppercase font-semibold">
                  Online
                </span>
              </div>
              <span className="font-headline-md text-sm sm:text-base text-on-surface font-bold truncate leading-tight">
                CentralCart
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              aria-label="Notificações"
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors relative"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary ring-2 ring-surface"></span>
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────
          4. CONTEÚDO PRINCIPAL (MAIN CONTENT)
      ──────────────────────────────────────────────────────────── */}
      <div className="lg:pl-64 w-full max-w-full">
        <main className="w-full pt-16 bg-surface px-3 sm:px-space-md lg:px-space-lg min-h-screen pb-24 lg:pb-space-2xl max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ───────────────────────────────────────────────────────────
          5. BOTTOM NAVIGATION BAR (MOBILE)
      ──────────────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-surface-container-high/40 pb-[max(env(safe-area-inset-bottom),0.35rem)]">
        <div className="flex justify-around items-center h-14 sm:h-16 px-1">
          <Link
            href="/admin"
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-colors ${
              pathname === "/admin"
                ? "text-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">dashboard</span>
            <span className="text-[10px] sm:text-xs">Início</span>
          </Link>

          <Link
            href="/admin/pedidos"
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-colors ${
              pathname === "/admin/pedidos"
                ? "text-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">shopping_cart</span>
            <span className="text-[10px] sm:text-xs">Pedidos</span>
          </Link>

          <Link
            href="/admin/produtos"
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-colors ${
              pathname === "/admin/produtos"
                ? "text-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">inventory_2</span>
            <span className="text-[10px] sm:text-xs">Produtos</span>
          </Link>

          <Link
            href="/admin/clientes"
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-0.5 transition-colors ${
              pathname === "/admin/clientes"
                ? "text-primary font-semibold"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">group</span>
            <span className="text-[10px] sm:text-xs">Clientes</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 gap-0.5 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[22px]">widgets</span>
            <span className="text-[10px] sm:text-xs">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
}