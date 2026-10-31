'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PricingSection() {
  const containerRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const section = containerRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      mm.add('(min-width: 0px)', () => {
        gsap.fromTo(
          '.pricing-card',
          {
            y: 40,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    },
    { scope: containerRef }
  );

  const plans = [
    {
      name: 'Starter',
      price: '20',
      desc: 'Para quem está lançando sua primeira loja de chaves, seriais ou infoprodutos.',
      features: [
        'Vitrine pronta com entrega automática',
        'Checkout Pix integrado (Mercado Pago)',
        'Estoque de seriais e chaves ilimitadas',
        'Subdomínio gratuito incluso',
        'Área do comprador (Minhas Compras)',
        'Suporte via ticket no painel',
      ],
      popular: false,
      ctaText: 'Começar 7 dias grátis',
      ctaHref: '/registro?plan=starter',
    },
    {
      name: 'Super',
      price: '40',
      desc: 'O mais escolhido para lojas que querem usar domínio próprio e personalizar temas.',
      features: [
        'Tudo do plano Starter',
        'Conexão de domínio próprio (.com.br)',
        'Personalização de temas, cores e fontes',
        'Múltiplos gateways (Efí Bank, Asaas, Stripe)',
        'Relatórios e gráficos analíticos de vendas',
        'Remoção da marca da plataforma no rodapé',
      ],
      popular: true,
      ctaText: 'Testar plano Super grátis',
      ctaHref: '/registro?plan=super',
    },
    {
      name: 'Rich',
      price: '70',
      desc: 'Para operações com alto volume de vendas que buscam prioridade e escala máxima.',
      features: [
        'Tudo do plano Super',
        'Zero taxa da plataforma sobre transações',
        'Estoque e produtos sem qualquer limite',
        'Suporte prioritário via WhatsApp',
        'Acesso antecipado a novos gateways',
      ],
      popular: false,
      ctaText: 'Testar plano Rich grátis',
      ctaHref: '/registro?plan=rich',
    },
  ];

  return (
    <section
      id="precos"
      ref={containerRef}
      className="py-24 sm:py-32 bg-[#090a0f] border-b border-white/[0.08] relative overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-2">
              [ 04 // ASSINATURA & PREÇOS ]
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Planos transparentes. <br className="hidden sm:inline" />
              Zero comissão sobre vendas.
            </h2>
          </div>
          <p className="text-sm text-neutral-400 max-w-sm font-normal leading-relaxed">
            Seu lucro é 100% seu. Teste qualquer plano por 7 dias grátis, sem precisar cadastrar cartão de crédito.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`pricing-card rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 will-change-transform ${
                p.popular
                  ? 'bg-[#12131b] border-2 border-white/40 shadow-[0_10px_40px_rgba(255,255,255,0.06)] md:-translate-y-2'
                  : 'bg-[#0f1017] border border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display text-xl font-bold text-white">{p.name}</h3>
                  {p.popular && (
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider bg-white text-black px-2.5 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 mb-6 min-h-[36px] leading-relaxed font-normal">
                  {p.desc}
                </p>

                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/[0.08]">
                  <span className="font-mono text-xs text-neutral-400">R$</span>
                  <span className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
                    {p.price}
                  </span>
                  <span className="font-mono text-xs text-neutral-400">/mês</span>
                </div>

                <ul className="space-y-3 mb-8 text-xs text-neutral-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={p.ctaHref}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 ${
                  p.popular
                    ? 'bg-white text-black hover:bg-neutral-200'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/10'
                }`}
              >
                <span>{p.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
