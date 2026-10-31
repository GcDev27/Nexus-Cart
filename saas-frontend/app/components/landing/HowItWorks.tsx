'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STEPS = [
  {
    title: 'Crie a loja',
    text: 'Escolha o nome e o endereço da sua loja. Depois cadastre o produto e as variações, como 30 dias, 90 dias ou vitalícia.',
  },
  {
    title: 'Suba suas chaves',
    text: 'Cole uma chave por linha em cada variação. Cada venda usa a próxima chave da fila, e nenhuma é entregue duas vezes.',
  },
  {
    title: 'Conecte o Mercado Pago',
    text: 'Cole o Access Token da sua conta no painel. O Pix é gerado na sua conta e o dinheiro cai direto nela.',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', once: true },
        });

        tl.from('.step-heading', { y: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
          .from('.step-item', { y: 30, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }, '-=0.5')
          // A linha entre os passos "anda" da esquerda para a direita
          .from('.step-line', { scaleX: 0, transformOrigin: '0% 50%', duration: 0.6, stagger: 0.15, ease: 'power2.inOut' }, '-=0.7');
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="como-funciona" ref={sectionRef} className="border-b border-ink-line scroll-mt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <h2 className="step-heading text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.025em] text-mist leading-tight max-w-xl">
          Do cadastro à primeira venda em três passos
        </h2>

        <ol className="mt-14 grid gap-12 md:gap-8 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="step-item relative md:pr-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full border border-violet bg-violet/10 text-violet-hi font-semibold">
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && (
                  <span aria-hidden className="step-line hidden md:block flex-1 h-px bg-gradient-to-r from-violet/60 to-ink-line" />
                )}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-mist">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim max-w-[22rem]">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
