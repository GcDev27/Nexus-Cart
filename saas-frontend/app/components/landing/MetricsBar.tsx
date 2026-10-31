'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function MetricsBar() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const numRef1 = useRef<HTMLDivElement | null>(null);
  const numRef2 = useRef<HTMLDivElement | null>(null);
  const numRef3 = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 0px)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              '.metric-block',
              {
                y: 30,
                opacity: 0,
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.15,
                ease: 'power3.out',
              }
            );

            // GSAP CountUp Animations
            const c1 = { val: 0 };
            gsap.to(c1, {
              val: 145,
              duration: 2.2,
              ease: 'power3.out',
              onUpdate: () => {
                if (numRef1.current) {
                  numRef1.current.textContent = `R$ ${Math.floor(c1.val)}M+`;
                }
              },
            });

            const c2 = { val: 0 };
            gsap.to(c2, {
              val: 6.5,
              duration: 2.2,
              ease: 'power3.out',
              onUpdate: () => {
                if (numRef2.current) {
                  numRef2.current.textContent = `${c2.val.toFixed(1)}M+`;
                }
              },
            });

            const c3 = { val: 0 };
            gsap.to(c3, {
              val: 30,
              duration: 2.2,
              ease: 'power3.out',
              onUpdate: () => {
                if (numRef3.current) {
                  numRef3.current.textContent = `${Math.floor(c3.val)}K+`;
                }
              },
            });
          },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-[#090a0f] py-20 sm:py-24 border-b border-white/[0.08] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-2">
              [ 01 // ESCALA & LIQUIDAÇÃO ]
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Construído para quem vive de vendas digitais.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-sm font-normal leading-relaxed">
            Liquidação instantânea direta na conta bancária do vendedor, com webhook dedicado e entrega de seriais 24 horas por dia.
          </p>
        </div>

        {/* 3 Metric Blocks com Hairline Grid Lines (Estilo Architectural Swiss) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          
          {/* Métrica 1 */}
          <div className="metric-block py-6 sm:py-0 sm:px-8 first:pl-0 last:pr-0 will-change-transform">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 block mb-3">
              01 // VOLUME PROCESSADO
            </span>
            <div
              ref={numRef1}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight font-mono mb-2"
            >
              R$ 0M+
            </div>
            <p className="text-xs text-neutral-400 font-normal">
              Transacionados com liquidação direta no banco do lojista
            </p>
          </div>

          {/* Métrica 2 */}
          <div className="metric-block py-6 sm:py-0 sm:px-8 first:pl-0 last:pr-0 will-change-transform">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 block mb-3">
              02 // PEDIDOS CONCLUÍDOS
            </span>
            <div
              ref={numRef2}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight font-mono mb-2"
            >
              0.0M+
            </div>
            <p className="text-xs text-neutral-400 font-normal">
              Chaves e licenças entregues automaticamente
            </p>
          </div>

          {/* Métrica 3 */}
          <div className="metric-block py-6 sm:py-0 sm:px-8 first:pl-0 last:pr-0 will-change-transform">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 block mb-3">
              03 // LOJAS DIGITAIS
            </span>
            <div
              ref={numRef3}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight font-mono mb-2"
            >
              0K+
            </div>
            <p className="text-xs text-neutral-400 font-normal">
              Vendedores operando na plataforma sem intermediários
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
