'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CentralDashboardMockup from './CentralDashboardMockup';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const HEADLINE = ['Caiu o Pix,', 'a chave chega sozinha.'];

export default function HeroSection() {
  const containerRef = useRef<HTMLElement | null>(null);
  const mockupWrapperRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
          mobile: '(max-width: 767px) and (prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { desktop } = context.conditions as { desktop: boolean; mobile: boolean };
          const wrapper = mockupWrapperRef.current;
          const container = containerRef.current;
          if (!wrapper || !container) return;

          // Entrada do texto: palavras sobem de trás de uma máscara
          const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
          intro
            .from('.reveal-word', { yPercent: 115, duration: 1, stagger: 0.05 })
            .from('.hero-sub', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
            .from('.hero-cta-group', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
            .from(wrapper, { y: 60, opacity: 0, duration: 1.1, ease: 'power3.out' }, '-=0.6');

          gsap.set('.mock-badge', { opacity: 0, y: 12, scale: 0.96 });

          if (desktop) {
            // O painel começa deitado e levanta conforme a página rola
            const lift = gsap.timeline({
              scrollTrigger: {
                trigger: container,
                start: 'top top+=20',
                end: 'bottom center+=120',
                scrub: 1.2,
              },
            });
            lift.fromTo(
              wrapper.firstElementChild,
              { rotateX: 22, scale: 0.84, y: 40, transformPerspective: 1200, transformOrigin: '50% 0%' },
              { rotateX: 0, scale: 1, y: 0, ease: 'none', duration: 1 }
            );
            // As notificações entram quando o painel termina de levantar
            lift.to('.mock-badge', { opacity: 1, y: 0, scale: 1, stagger: 0.12, duration: 0.25, ease: 'power2.out' }, 0.75);
          } else {
            gsap.to('.mock-badge', {
              opacity: 1,
              y: 0,
              scale: 1,
              stagger: 0.15,
              duration: 0.6,
              ease: 'power3.out',
              scrollTrigger: { trigger: wrapper, start: 'top 75%' },
            });
          }
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative pt-16 sm:pt-24 text-center overflow-hidden border-b border-ink-line">
      {/* Brilho violeta da logo atrás do painel */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[52%] -translate-x-1/2 w-[900px] max-w-[140%] h-[520px] rounded-full bg-violet-lo/25 blur-[140px]"
      />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
        {/* Cada palavra é animada, mas os espaços reais ficam no texto para leitores de tela e buscadores */}
        <h1 className="text-[2.6rem] leading-[1.04] sm:text-6xl md:text-7xl lg:text-[5.25rem] font-semibold tracking-[-0.04em] text-mist">
          {HEADLINE.map((line) => (
            <span key={line} className="block">
              {line.split(' ').map((word, i, words) => (
                <React.Fragment key={`${word}-${i}`}>
                  <span className="inline-block overflow-hidden align-bottom pb-[0.08em]">
                    <span className="reveal-word inline-block">{word}</span>
                  </span>
                  {i < words.length - 1 && ' '}
                </React.Fragment>
              ))}
            </span>
          ))}
        </h1>

        <p className="hero-sub mt-6 mx-auto max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-mist-dim">
          Monte sua loja de keys, licenças e produtos digitais, suba suas chaves e conecte sua conta do Mercado Pago.
          Quando o comprador paga, a chave aparece na tela dele, mesmo com você offline.
        </p>

        <div className="hero-cta-group mt-10 mb-14 sm:mb-16 flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Link
              href="/registro"
              className="rounded-lg bg-violet hover:bg-violet-hi text-white font-semibold px-7 py-3.5 transition-colors shadow-[0_8px_30px_-6px_rgba(157,62,244,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
            >
              Criar minha loja
            </Link>
            <a
              href="#como-funciona"
              className="rounded-lg border border-ink-line hover:border-mist-dim bg-ink/60 text-mist font-medium px-7 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
            >
              Ver como funciona
            </a>
          </div>
          <p className="text-sm text-mist-dim">7 dias grátis, sem cartão de crédito.</p>
        </div>

        <div ref={mockupWrapperRef} className="relative w-full [perspective:1400px]">
          <div className="origin-top transform-gpu will-change-transform">
            <CentralDashboardMockup />
          </div>
        </div>
      </div>

      <div className="h-12 sm:h-16" />
    </section>
  );
}
