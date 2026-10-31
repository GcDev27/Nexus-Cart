'use client';

import React, { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const STORE_THEMES = [
  { name: 'Dark Premium', bg: '#09090b', card: '#18181b', accent: '#8b5cf6', text: '#fafafa' },
  { name: 'Clean Light', bg: '#f8f8f8', card: '#ffffff', accent: '#2563eb', text: '#111111' },
  { name: 'Gamer Neon', bg: '#020204', card: '#0c0c14', accent: '#22c55e', text: '#e2e8ff' },
];

const cardClass =
  'feature-bento-card rounded-2xl bg-ink-raised border border-ink-line hover:border-violet/50 transition-colors duration-300 p-7 sm:p-8';

export default function PinnedCarouselSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      // Colunas rolam em velocidades diferentes (só desktop e sem preferência por menos movimento)
      mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to('.parallax-col-1', {
          y: -40,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        });
        gsap.to('.parallax-col-2', {
          y: -110,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.2 },
        });
      });

      // Cada card entra desfocado e sobe até o lugar quando aparece na tela
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>('.feature-bento-card').forEach((card) => {
          gsap.fromTo(
            card,
            { y: 40, opacity: 0, filter: 'blur(10px)' },
            {
              y: 0,
              opacity: 1,
              filter: 'blur(0px)',
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: card, start: 'top 88%', toggleActions: 'play none none none' },
            }
          );
        });

        // Linhas de estoque entram uma a uma
        gsap.from('.stock-line', {
          x: -12,
          opacity: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.stock-list', start: 'top 85%' },
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section id="recursos" ref={sectionRef} className="relative border-b border-ink-line overflow-hidden scroll-mt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-end">
          <h2 className="text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.025em] text-mist leading-tight">
            Você cuida dos produtos. A entrega roda sozinha.
          </h2>
          <p className="text-[15px] leading-relaxed text-mist-dim max-w-md">
            Tudo o que uma loja de produtos digitais precisa para vender sem você conferir pagamento ou mandar chave
            no privado.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="parallax-col-1 flex flex-col gap-6 will-change-transform">
            {/* Estoque */}
            <article className={cardClass}>
              <h3 className="text-xl font-semibold text-mist">Estoque de chaves por variação</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim">
                Cole centenas de chaves de uma vez. Cada variação tem a própria fila, e o painel mostra quantas ainda
                estão disponíveis.
              </p>
              <ul className="stock-list mt-6 rounded-xl bg-ink border border-ink-line divide-y divide-ink-line text-sm">
                {[
                  { key: 'VIP-3HTM-8WQA-K2ZD', status: 'Disponível' },
                  { key: 'VIP-9PLC-4RXN-T6BE', status: 'Disponível' },
                  { key: 'VIP-7KQ2-9XMP-4RLA', status: 'Entregue' },
                ].map((line) => (
                  <li key={line.key} className="stock-line flex items-center justify-between gap-3 px-4 py-3">
                    <span
                      className={`font-mono text-[13px] ${
                        line.status === 'Entregue' ? 'text-mist-dim line-through' : 'text-mist'
                      }`}
                    >
                      {line.key}
                    </span>
                    <span className={`text-xs ${line.status === 'Entregue' ? 'text-mist-dim' : 'text-paid'}`}>
                      {line.status}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            {/* Área do comprador */}
            <article className={cardClass}>
              <h3 className="text-xl font-semibold text-mist">Área &quot;Minhas compras&quot;</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim">
                O comprador cria uma conta na sua loja e encontra todas as chaves que comprou quando precisar. Menos
                gente pedindo a chave de novo no seu Discord.
              </p>
            </article>

            {/* Entrega manual */}
            <article className={cardClass}>
              <h3 className="text-xl font-semibold text-mist">Entrega manual quando precisar</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim">
                Vende algo que não é chave, como um serviço ou um item no jogo? Marque a variação como entrega manual e
                escreva a mensagem que o comprador recebe depois de pagar.
              </p>
            </article>
          </div>

          <div className="parallax-col-2 flex flex-col gap-6 will-change-transform md:mt-24">
            {/* Vitrine */}
            <article className={cardClass}>
              <h3 className="text-xl font-semibold text-mist">Vitrine com a cara da sua marca</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim">
                Escolha um dos três temas, a cor de destaque, a fonte, o texto de abertura e o seu logo. Sem código.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3">
                {STORE_THEMES.map((theme) => (
                  <figure key={theme.name}>
                    <div
                      aria-hidden
                      className="aspect-[4/5] rounded-lg p-2 flex flex-col gap-1.5 border border-ink-line"
                      style={{ background: theme.bg }}
                    >
                      <div className="h-1.5 w-1/2 rounded-full" style={{ background: theme.text, opacity: 0.8 }} />
                      <div className="flex-1 rounded-md" style={{ background: theme.card }} />
                      <div className="h-3 rounded" style={{ background: theme.accent }} />
                    </div>
                    <figcaption className="mt-2 text-xs text-mist-dim text-center">{theme.name}</figcaption>
                  </figure>
                ))}
              </div>
            </article>

            {/* Painel */}
            <article className={cardClass}>
              <h3 className="text-xl font-semibold text-mist">Painel de vendas</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-mist-dim">
                Veja faturamento, pedidos e ticket médio dos últimos 7, 30 ou 90 dias, e quais produtos mais vendem.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
