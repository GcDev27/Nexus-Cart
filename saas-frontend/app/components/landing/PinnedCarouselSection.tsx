'use client';

import React, { useRef } from 'react';
import { 
  Key, Palette, QrCode, UserCheck, 
  TrendingUp, Check, ShieldCheck, Zap, Copy
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PinnedCarouselSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const mm = gsap.matchMedia();

      // Desktop (≥ 768px): Parallax com Scrub com velocidades independentes
      mm.add('(min-width: 768px)', () => {
        gsap.to('.parallax-col-1', {
          y: -50,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });

        gsap.to('.parallax-col-2', {
          y: -120,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      });

      // Entrada suave de cada card com Blur 10px -> 0px + Deslocamento Y
      const cards = gsap.utils.toArray<HTMLElement>('.feature-bento-card');
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          {
            y: 40,
            opacity: 0,
            filter: 'blur(10px)',
          },
          {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: card,
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="recursos"
      ref={sectionRef}
      className="relative py-24 sm:py-32 bg-[#090a0f] overflow-hidden border-b border-white/[0.08]"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Header Editorial */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 sm:mb-20 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-2">
              [ 02 // RECURSOS DA PLATAFORMA ]
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1]">
              Feito para você vender. <br className="hidden sm:inline" />
              O resto roda sozinho.
            </h2>
          </div>
          <p className="text-sm text-neutral-400 max-w-md font-normal leading-relaxed">
            Estrutura desenhada para quem comercializa seriais, licenças e produtos digitais. Sem necessidade de programação ou conferência manual.
          </p>
        </div>

        {/* Parallax Bento Grid (2 Colunas com velocidades assimétricas) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Coluna 1 (Esquerda) */}
          <div className="parallax-col-1 md:col-span-6 flex flex-col gap-6 sm:gap-8 will-change-transform">
            
            {/* Card 1: Estoque de Chaves & Seriais */}
            <div className="feature-bento-card group p-7 sm:p-8 rounded-2xl bg-[#0f1017] border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[11px] text-neutral-400 tracking-wider">
                  // 01 ESTOQUE DE LICENÇAS
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ENTREGA IMEDIATA
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Estoque de Chaves por Variação
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                Suba centenas de chaves seriais em lote. Cada variação de produto (ex: Mensal, Anual, Vitalício) consome uma linha de estoque assim que o Pix é liquidado.
              </p>

              {/* Mockup de Linha de Estoque */}
              <div className="rounded-xl bg-[#08090d] border border-white/[0.06] p-4 font-mono text-xs">
                <div className="flex items-center justify-between text-neutral-500 text-[10px] pb-2 border-b border-white/[0.06] uppercase tracking-wider">
                  <span>Chave / Licença</span>
                  <span>Status</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-300">NX-9941-PRO-BR</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-semibold">● Disponível</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <span className="text-neutral-300">NX-9942-PRO-BR</span>
                    <span className="text-[10px] text-emerald-400 font-sans font-semibold">● Disponível</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between text-neutral-400">
                    <span className="line-through">NX-9940-PRO-BR</span>
                    <span className="text-[10px] text-neutral-400 font-sans">Entregue via Pix</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Portal do Cliente */}
            <div className="feature-bento-card group p-7 sm:p-8 rounded-2xl bg-[#0f1017] border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[11px] text-neutral-400 tracking-wider">
                  // 02 AUTOATENDIMENTO
                </span>
                <span className="font-mono text-[10px] text-neutral-300 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/10">
                  ZERO SUPORTE
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Portal do Comprador (&quot;Minhas Compras&quot;)
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                Seus clientes nunca perdem o que compraram. Eles acessam a área de autoatendimento da sua loja, digitam o e-mail e resgatam as chaves seriais a qualquer momento.
              </p>

              <div className="p-4 rounded-xl bg-[#08090d] border border-white/[0.06] flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white font-sans">Histórico de Pedidos Seguro</div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">lojaseu-site.com/minhas-compras</div>
                </div>
                <span className="font-mono text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Auto-resgate
                </span>
              </div>
            </div>

          </div>

          {/* Coluna 2 (Direita) */}
          <div className="parallax-col-2 md:col-span-6 flex flex-col gap-6 sm:gap-8 will-change-transform">
            
            {/* Card 3: Vitrine e Temas Nativos */}
            <div className="feature-bento-card group p-7 sm:p-8 rounded-2xl bg-[#0f1017] border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[11px] text-neutral-400 tracking-wider">
                  // 03 CUSTOMIZAÇÃO NO-CODE
                </span>
                <span className="font-mono text-[10px] text-neutral-300 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/10">
                  3 TEMAS NATIVOS
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Vitrine Pronta em Segundos
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                Alterne entre Dark Premium, Clean Light e Gamer Neon pelo painel. Escolha sua cor de destaque, conecte tipografias do Google Fonts e envie seu logotipo sem programar nada.
              </p>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="p-3 rounded-lg bg-[#08090d] border border-white/15 text-center">
                  <div className="w-3 h-3 rounded-full bg-white mx-auto mb-1.5" />
                  <span className="text-xs text-white font-medium block">Dark</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Premium</span>
                </div>
                <div className="p-3 rounded-lg bg-[#08090d] border border-white/[0.06] text-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400 mx-auto mb-1.5" />
                  <span className="text-xs text-white font-medium block">Gamer</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Neon</span>
                </div>
                <div className="p-3 rounded-lg bg-[#08090d] border border-white/[0.06] text-center">
                  <div className="w-3 h-3 rounded-full bg-neutral-400 mx-auto mb-1.5" />
                  <span className="text-xs text-white font-medium block">Clean</span>
                  <span className="text-[10px] text-neutral-400 font-mono">Light</span>
                </div>
              </div>
            </div>

            {/* Card 4: Checkout com Pix */}
            <div className="feature-bento-card group p-7 sm:p-8 rounded-2xl bg-[#0f1017] border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[11px] text-neutral-400 tracking-wider">
                  // 04 CHECKOUT TRANSPARENTE
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  &lt; 3 SEGUNDOS
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Pix com Confirmação Imediata
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                QR Code dinâmico na tela e Pix Copia e Cola gerado na hora. O webhook oficial da adquirente aprova e a chave serial é liberada antes do comprador fechar a aba.
              </p>

              <div className="p-3.5 rounded-xl bg-[#08090d] border border-white/[0.06] flex items-center justify-between font-mono text-xs">
                <span className="text-neutral-400">Webhook Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  200 OK • Liquidação instantânea
                </span>
              </div>
            </div>

            {/* Card 5: Métricas em Tempo Real */}
            <div className="feature-bento-card group p-7 sm:p-8 rounded-2xl bg-[#0f1017] border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[11px] text-neutral-400 tracking-wider">
                  // 05 ANALYTICS NATIVO
                </span>
                <span className="font-mono text-[10px] text-neutral-300 bg-white/[0.05] px-2.5 py-0.5 rounded-full border border-white/10">
                  TEMPO REAL
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Métricas Consolidadas no Painel
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed font-normal">
                Acompanhe receita total, ticket médio e volume de transações por período (7D, 30D, 90D, 1A) com filtros simples e exportação de dados em um clique.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
