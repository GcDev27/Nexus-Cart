'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type Feature = { label: string; soon?: boolean };

const PLANS: {
  name: string;
  price: string;
  desc: string;
  features: Feature[];
  highlighted: boolean;
  cta: string;
  href: string;
}[] = [
  {
    name: 'Starter',
    price: '20',
    desc: 'Para colocar a primeira loja no ar.',
    features: [
      { label: 'Loja com entrega automática de chaves' },
      { label: 'Pix pela sua conta do Mercado Pago' },
      { label: 'Chaves e produtos sem limite' },
      { label: 'Endereço nexuscart.com/loja/sua-loja' },
      { label: 'Área "Minhas compras" para o comprador' },
    ],
    highlighted: false,
    cta: 'Testar o Starter',
    href: '/registro?plan=starter',
  },
  {
    name: 'Super',
    price: '40',
    desc: 'Para quem quer a loja com a cara da marca.',
    features: [
      { label: 'Tudo do Starter' },
      { label: 'Temas, cores, fontes e logo da loja' },
      { label: 'Painel de vendas com gráficos' },
      { label: 'Domínio próprio (.com.br)', soon: true },
      { label: 'Loja sem a marca NexusCart no rodapé', soon: true },
    ],
    highlighted: true,
    cta: 'Testar o Super',
    href: '/registro?plan=super',
  },
  {
    name: 'Rich',
    price: '70',
    desc: 'Para lojas com muito movimento.',
    features: [
      { label: 'Tudo do Super' },
      { label: 'Suporte prioritário pelo WhatsApp' },
      { label: 'Novos gateways antes dos outros planos', soon: true },
    ],
    highlighted: false,
    cta: 'Testar o Rich',
    href: '/registro?plan=rich',
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.pricing-card',
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="precos" ref={sectionRef} className="border-b border-ink-line scroll-mt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-end">
          <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.025em] text-mist leading-tight">
            Mensalidade fixa, sem porcentagem das vendas
          </h2>
          <p className="text-[15px] leading-relaxed text-mist-dim max-w-md">
            Teste qualquer plano por 7 dias sem cadastrar cartão. Os itens marcados como &quot;em breve&quot; entram
            no plano assim que forem lançados.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-card rounded-2xl p-7 sm:p-8 flex flex-col will-change-transform ${
                plan.highlighted
                  ? 'bg-ink-raised border-2 border-violet shadow-[0_20px_60px_-20px_rgba(157,62,244,0.55)] md:-mt-3 md:mb-3'
                  : 'bg-ink-raised border border-ink-line hover:border-violet/50 transition-colors'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-mist">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="rounded-full bg-violet/15 text-violet-hi text-xs font-medium px-2.5 py-1">
                    Mais escolhido
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-mist-dim">{plan.desc}</p>

              <p className="mt-6 pb-6 border-b border-ink-line flex items-baseline gap-1 text-mist">
                <span className="text-base">R$</span>
                <span className="text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className="text-sm text-mist-dim">por mês</span>
              </p>

              <ul className="mt-6 space-y-3 text-sm flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 shrink-0 mt-0.5 ${feature.soon ? 'text-mist-dim' : 'text-violet-hi'}`} />
                    <span className={feature.soon ? 'text-mist-dim' : 'text-mist'}>
                      {feature.label}
                      {feature.soon && <span className="ml-1.5 text-xs text-mist-dim">(em breve)</span>}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-8 w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi ${
                  plan.highlighted
                    ? 'bg-violet hover:bg-violet-hi text-white'
                    : 'border border-ink-line hover:border-mist-dim text-mist'
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
