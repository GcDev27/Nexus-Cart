'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import CentralDashboardMockup from './CentralDashboardMockup';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mockupWrapperRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      // Text Reveal no título principal com clip-path e stagger
      tl.from(
        '.reveal-word',
        {
          yPercent: 120,
          opacity: 0,
          rotateZ: 1.5,
          duration: 1,
          stagger: 0.05,
          ease: 'power4.out',
        }
      );

      // Subtítulo editorial
      tl.from(
        '.hero-sub',
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.5'
      );

      // CTA e informações de confiança
      tl.from(
        '.hero-cta-group',
        {
          y: 20,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.4'
      );

      // Animação 3D com Scroll Scrub no Mockup do Dashboard
      const mm = gsap.matchMedia();

      mm.add('(min-width: 768px)', () => {
        if (!mockupWrapperRef.current || !containerRef.current) return;

        gsap.fromTo(
          mockupWrapperRef.current,
          {
            scale: 0.82,
            rotateX: 20,
            y: 50,
            opacity: 0.7,
            transformPerspective: 1200,
            transformOrigin: '50% 0%',
          },
          {
            scale: 1,
            rotateX: 0,
            y: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: containerRef.current,
              start: 'top top+=20',
              end: 'bottom center+=120',
              scrub: 1.2,
            },
          }
        );
      });

      mm.add('(max-width: 767px)', () => {
        if (!mockupWrapperRef.current) return;

        gsap.fromTo(
          mockupWrapperRef.current,
          {
            opacity: 0.75,
            y: 30,
            scale: 0.96,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: mockupWrapperRef.current,
              start: 'top 90%',
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  const line1Words = ['Crie', 'sua', 'loja', 'de'];
  const line2Words = ['produtos', 'digitais.'];

  return (
    <section
      ref={containerRef}
      className="relative pt-16 sm:pt-24 pb-0 bg-[#090a0f] text-center overflow-hidden"
    >
      {/* Subtle architectural grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Ambient gradient top focus */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.04] blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Headline com Tipografia Display Moderna (Space Grotesk) - Sem gradientes genéricos de IA */}
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-bold tracking-[-0.04em] text-white leading-[1.04] mb-6">
          <span className="block">
            {line1Words.map((word, index) => (
              <span
                key={index}
                className="inline-block overflow-hidden mr-[0.25em] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]"
              >
                <span className="reveal-word inline-block">{word}</span>
              </span>
            ))}
          </span>
          <span className="block text-neutral-400">
            {line2Words.map((word, index) => (
              <span
                key={index}
                className="inline-block overflow-hidden mr-[0.25em] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%)]"
              >
                <span className="reveal-word inline-block text-white">
                  {word}
                </span>
              </span>
            ))}
          </span>
        </h1>

        {/* Subtitle Direto e Humano */}
        <p className="hero-sub font-sans text-base sm:text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Entrega automática de chaves seriais, checkout Pix nativo e o dinheiro caindo direto no seu banco. Sem intermediários, sem taxas sobre as suas vendas.
        </p>

        {/* CTA Group */}
        <div className="hero-cta-group flex flex-col items-center gap-4 mb-14 sm:mb-16">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/registro"
              className="group flex items-center gap-2.5 bg-white text-black hover:bg-neutral-200 font-semibold text-sm sm:text-base px-8 py-3.5 rounded-full transition-all duration-200 shadow-[0_1px_20px_rgba(255,255,255,0.15)] hover:scale-[1.01]"
            >
              <span>Criar minha loja gratuitamente</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-neutral-400 hover:text-white font-medium text-sm px-5 py-3.5 rounded-full border border-white/10 hover:border-white/20 transition-colors"
            >
              Acessar meu painel
            </Link>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono tracking-tight">
            <span>7 DIAS GRÁTIS</span>
            <span className="text-neutral-600">•</span>
            <span>SEM CARTÃO DE CRÉDITO</span>
            <span className="text-neutral-600">•</span>
            <span>PIX DIRETO NO SEU BANCO</span>
          </div>
        </div>

        {/* Dashboard Mockup Display com container 3D perspective */}
        <div className="relative w-full [perspective:1400px]">
          <div ref={mockupWrapperRef} className="origin-top transform-gpu will-change-transform">
            <CentralDashboardMockup />
          </div>
        </div>

      </div>

      {/* Hairline divider bottom */}
      <div className="w-full h-px bg-white/[0.08] mt-12 sm:mt-16" />
    </section>
  );
}
