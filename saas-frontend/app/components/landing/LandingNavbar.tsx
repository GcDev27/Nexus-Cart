'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Como funciona', href: '#como-funciona' },
    { label: 'Recursos', href: '#recursos' },
    { label: 'Pagamentos', href: '#pagamentos' },
    { label: 'Preços', href: '#precos' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        isScrolled
          ? 'bg-ink/90 backdrop-blur-xl border-b border-ink-line'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-hi">
          <Image src="/nexuscart-icon.png" alt="" width={30} height={30} className="object-contain rounded-[7px]" priority />
          <span className="font-semibold text-[17px] tracking-tight">
            <span className="text-mist">Nexus</span>
            <span className="text-violet-hi">Cart</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" aria-label="Seções da página">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-mist-dim hover:text-mist transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-hi"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-mist-dim hover:text-mist px-3 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-violet-hi"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="text-sm font-semibold text-white bg-violet hover:bg-violet-hi px-4 py-2 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
          >
            Criar minha loja
          </Link>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-mist-dim hover:text-mist rounded-lg transition-colors"
          aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-ink border-b border-ink-line px-5 pb-6">
          <nav className="flex flex-col py-2" aria-label="Seções da página">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base text-mist py-3 border-b border-ink-line last:border-0"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-4">
            <Link href="/registro" className="w-full text-center py-3 rounded-lg bg-violet text-white font-semibold text-sm">
              Criar minha loja
            </Link>
            <Link href="/login" className="w-full text-center py-3 rounded-lg text-mist-dim text-sm">
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
