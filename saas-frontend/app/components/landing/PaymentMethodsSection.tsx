'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import PixDemo from './PixDemo';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PIX_POINTS = [
  {
    title: 'O dinheiro não passa por nós',
    text: 'A cobrança é criada na sua conta do Mercado Pago. O saldo cai lá, com as taxas do próprio Mercado Pago.',
  },
  {
    title: 'Confirmação automática',
    text: 'Assim que o Mercado Pago aprova o Pix, o pedido muda para pago e a chave é liberada.',
  },
  {
    title: 'Sem porcentagem sobre as vendas',
    text: 'Você paga só a mensalidade do plano. Vendeu R$ 100, os R$ 100 são seus.',
  },
];

const COMING_SOON = ['Efí Bank', 'Asaas', 'Cartão de crédito'];

export default function PaymentMethodsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const leftCol = leftColRef.current;
      if (!section || !leftCol) return;

      const mm = gsap.matchMedia();

      // Desktop: o título fica fixo enquanto os cards da direita rolam
      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top+=96',
          end: 'bottom bottom-=40',
          pin: leftCol,
          pinSpacing: false,
        });
      });

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.payment-card').forEach((card) => {
          gsap.fromTo(
            card,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none none' },
            }
          );
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="pagamentos" ref={sectionRef} className="relative border-b border-ink-line scroll-mt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div ref={leftColRef} className="lg:col-span-5">
            <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.025em] text-mist leading-tight">
              O Pix cai direto na sua conta
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-mist-dim">
              Hoje o NexusCart recebe pagamentos por Pix usando a sua conta do Mercado Pago. Você conecta uma vez no
              painel e pronto. Ao lado, veja o que o seu comprador vê na hora de pagar.
            </p>
            <Link
              href="/registro"
              className="mt-8 inline-block rounded-lg border border-ink-line hover:border-mist-dim text-mist text-sm font-medium px-5 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
            >
              Criar loja e conectar o Mercado Pago
            </Link>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="payment-card rounded-2xl bg-ink-raised/40 border border-ink-line p-6 sm:p-10">
              <PixDemo />
              <p className="mt-5 text-center text-xs text-mist-dim">
                Clique em &quot;Simular pagamento&quot; para testar a entrega.
              </p>
            </div>

            <article className="payment-card rounded-2xl bg-ink-raised border border-ink-line p-7 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-mist">Pix com Mercado Pago</h3>
                <span className="text-xs text-paid">Disponível</span>
              </div>
              <dl className="mt-6 divide-y divide-ink-line">
                {PIX_POINTS.map((point) => (
                  <div key={point.title} className="py-4 first:pt-0 last:pb-0">
                    <dt className="text-[15px] font-medium text-mist">{point.title}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-mist-dim">{point.text}</dd>
                  </div>
                ))}
              </dl>
            </article>

            <article className="payment-card rounded-2xl border border-dashed border-ink-line p-7 sm:p-8">
              <h3 className="text-lg font-semibold text-mist">Próximas formas de pagamento</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist-dim">
                Estamos trabalhando nestas integrações. Elas vão aparecer no painel quando estiverem prontas.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {COMING_SOON.map((item) => (
                  <li key={item} className="rounded-full border border-ink-line px-3 py-1.5 text-sm text-mist-dim">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
