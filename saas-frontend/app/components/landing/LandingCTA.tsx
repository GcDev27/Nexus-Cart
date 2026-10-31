'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingCTA() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.cta-inner',
          { y: 40, scale: 0.97, opacity: 0 },
          {
            y: 0,
            scale: 1,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative border-b border-ink-line overflow-hidden text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 w-[800px] max-w-[150%] h-[400px] rounded-full bg-violet-lo/25 blur-[130px]"
      />

      <div className="cta-inner relative max-w-4xl mx-auto px-5 sm:px-8 py-24 sm:py-36 will-change-transform">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-[-0.035em] text-mist leading-[1.05]">
          Coloque sua loja no ar ainda hoje
        </h2>
        <p className="mt-6 mx-auto max-w-xl text-base sm:text-lg leading-relaxed text-mist-dim">
          Cadastre um produto, cole suas chaves e conecte o Mercado Pago. São 7 dias grátis para testar com vendas de
          verdade.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/registro"
            className="rounded-lg bg-violet hover:bg-violet-hi text-white font-semibold px-8 py-4 transition-colors shadow-[0_8px_30px_-6px_rgba(157,62,244,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
          >
            Criar minha loja
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-ink-line hover:border-mist-dim bg-ink/60 text-mist font-medium px-8 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
          >
            Já tenho uma loja
          </Link>
        </div>
        <p className="mt-5 text-sm text-mist-dim">7 dias grátis, sem cartão de crédito.</p>
      </div>
    </section>
  );
}
