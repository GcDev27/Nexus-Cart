'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingCTA() {
  const containerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const section = containerRef.current;
      if (!section) return;

      gsap.fromTo(
        '.cta-inner',
        {
          y: 40,
          scale: 0.97,
          opacity: 0,
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative py-28 sm:py-36 bg-[#090a0f] text-center overflow-hidden border-b border-white/[0.08]"
    >
      <div className="cta-inner max-w-4xl mx-auto px-6 relative z-10 will-change-transform">
        
        <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-3">
          [ 06 // COMECE AGORA ]
        </div>

        <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold text-white tracking-tight leading-[1.06] mb-6">
          Sua loja pronta para vender <br className="hidden sm:inline" />
          em menos de 15 minutos.
        </h2>

        <p className="font-sans text-base sm:text-lg text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed font-normal">
          Cadastre suas chaves seriais, conecte seu Pix e deixe a plataforma automatizar todo o fluxo de entrega.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/registro"
            className="group w-full sm:w-auto flex items-center justify-center gap-2.5 bg-white text-black hover:bg-neutral-200 font-semibold text-sm sm:text-base px-9 py-4 rounded-full transition-all duration-200 shadow-[0_1px_25px_rgba(255,255,255,0.15)] hover:scale-[1.01]"
          >
            <span>Criar minha loja grátis</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto text-neutral-400 hover:text-white px-7 py-4 rounded-full text-sm font-medium border border-white/10 hover:border-white/20 transition-all"
          >
            Acessar painel existente
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-neutral-400">
          <span>7 DIAS DE TESTE GRÁTIS</span>
          <span className="text-neutral-600">•</span>
          <span>SEM CARTÃO DE CRÉDITO</span>
          <span className="text-neutral-600">•</span>
          <span>ZERO TAXA SOBRE VENDAS</span>
        </div>

      </div>
    </section>
  );
}
