'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X, ArrowUpRight } from 'lucide-react';

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
    { label: 'Recursos', href: '#recursos' },
    { label: 'Pagamentos', href: '#pagamentos' },
    { label: 'Preços', href: '#precos' },
    { label: 'Dúvidas', href: '#faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#090a0f]/85 backdrop-blur-xl border-b border-white/8 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
          : 'bg-transparent border-b border-white/[0.05] py-4 sm:py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-white/30">
            <Image
              src="/nexuscart-icon.png"
              alt="NexusCart"
              width={18}
              height={18}
              className="object-contain"
            />
          </div>
          <span className="font-display font-bold text-base text-white tracking-tight">
            NexusCart
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/8 rounded-full px-3 py-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-neutral-400 hover:text-white px-3.5 py-1.5 rounded-full hover:bg-white/[0.05] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium text-neutral-400 hover:text-white px-3.5 py-2 transition-colors"
          >
            Entrar no Painel
          </Link>
          <Link
            href="/registro"
            className="group flex items-center gap-2 bg-white text-black hover:bg-neutral-100 font-semibold text-xs px-4 py-2.5 rounded-full transition-all duration-200"
          >
            <span>Criar Loja Grátis</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c0d12] border-b border-white/10 px-6 py-6 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2 mb-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-neutral-300 hover:text-white py-2"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/8">
            <Link
              href="/login"
              className="text-sm text-center font-medium text-neutral-400 hover:text-white py-2"
            >
              Entrar no Painel
            </Link>
            <Link
              href="/registro"
              className="w-full text-center py-3 rounded-full bg-white text-black font-semibold text-sm"
            >
              Criar Loja Grátis
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
