'use client';

import React, { useRef } from 'react';
import { 
  Check, ArrowRight, ShieldCheck, Zap, Lock, CreditCard, QrCode, Bitcoin
} from 'lucide-react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function PaymentMethodsSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const leftColRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const leftCol = leftColRef.current;
      if (!section || !leftCol) return;

      const mm = gsap.matchMedia();

      // Desktop (≥ 1024px): Fixação do título esquerdo (Pinning) enquanto os cards rolam fluidamente
      mm.add('(min-width: 1024px)', () => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top+=80',
          end: 'bottom bottom-=40',
          pin: leftCol,
          pinSpacing: false,
        });

        const cards = gsap.utils.toArray<HTMLElement>('.payment-card');
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            {
              y: 40,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      });

      // Mobile (< 1024px): Layout linear com fade-in leve sem pinning
      mm.add('(max-width: 1023px)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.payment-card');
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            {
              y: 30,
              opacity: 0,
            },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
                toggleActions: 'play none none none',
              },
            }
          );
        });
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="pagamentos"
      ref={sectionRef}
      className="relative py-24 sm:py-32 bg-[#090a0f] border-b border-white/[0.08] overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Coluna Esquerda: Fixada na Tela (Pinned) no Desktop */}
          <div ref={leftColRef} className="lg:col-span-5 lg:sticky will-change-transform">
            
            <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-3">
              [ 03 // PAGAMENTOS & LIQUIDAÇÃO ]
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-5">
              O dinheiro cai direto na sua conta bancária.
            </h2>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed mb-8 font-normal">
              A NexusCart conecta sua própria conta do Mercado Pago, Efí Bank, Asaas ou Stripe. Não retemos o seu saldo e não cobramos taxas sobre as suas vendas.
            </p>

            {/* Destaques Técnicos de Confiança */}
            <div className="space-y-4 pt-6 border-t border-white/[0.08]">
              <div className="flex items-start gap-3">
                <div className="font-mono text-xs text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                  01
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Zero Intermediação Financeira</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">O cliente paga e o saldo vai diretamente para o seu gateway cadastrado.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="font-mono text-xs text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                  02
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Webhooks Dedicados</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Confirmação automática em 2 a 3 segundos com liberação imediata da chave serial.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="font-mono text-xs text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                  03
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Múltiplos Gateways Nativos</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">Use Mercado Pago e Efí Bank para Pix, e Stripe ou Asaas para Cartão de Crédito.</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-5 py-3 rounded-full transition-all"
              >
                <span>Cadastrar gateway no painel</span>
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
            </div>

          </div>

          {/* Coluna Direita: Cards que rolam suavemente */}
          <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
            
            {/* Card 1: Pix */}
            <div className="payment-card p-8 rounded-2xl border border-white/[0.08] bg-[#0f1017] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  MÉTODO #01 // PIX IMEDIATO
                </span>
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  APROVAÇÃO INSTANTÂNEA
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Pix com Confirmação e Entrega na Hora
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                O cliente gera o QR Code no checkout ou utiliza o Pix Copia e Cola. O webhook oficial da sua conta bancária valida o pagamento e revela o serial na mesma tela.
              </p>

              <div className="space-y-2.5 pt-5 border-t border-white/[0.06] text-xs text-neutral-300 font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>QR Code e Copia e Cola integrados direto na vitrine</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Integração oficial com Mercado Pago e Efí Bank (Gerencianet)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Entrega de licenças e seriais sem qualquer conferência manual</span>
                </div>
              </div>
            </div>

            {/* Card 2: Cartão de Crédito */}
            <div className="payment-card p-8 rounded-2xl border border-white/[0.08] bg-[#0f1017] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  MÉTODO #02 // CARTÃO
                </span>
                <span className="font-mono text-[10px] text-neutral-300 bg-white/[0.05] border border-white/10 px-2.5 py-0.5 rounded-full">
                  EM ATÉ 12X
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Cartão de Crédito com Antifraude
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                Ofereça parcelamento em compras de planos vitalícios ou pacotes maiores. A cobrança é processada com criptografia ponta a ponta na sua conta Stripe ou Mercado Pago.
              </p>

              <div className="space-y-2.5 pt-5 border-t border-white/[0.06] text-xs text-neutral-300 font-sans">
                <div className="flex items-center gap-2.5">
                  <span className="text-neutral-400 font-bold">✓</span>
                  <span>Bandeiras Visa, Mastercard, Elo e American Express</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-neutral-400 font-bold">✓</span>
                  <span>Análise de risco e proteção antifraude nativa da adquirente</span>
                </div>
              </div>
            </div>

            {/* Card 3: Criptomoedas */}
            <div className="payment-card p-8 rounded-2xl border border-white/[0.08] bg-[#0f1017] hover:border-white/20 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
                  MÉTODO #03 // CRIPTO
                </span>
                <span className="font-mono text-[10px] text-neutral-400 bg-white/[0.04] border border-white/8 px-2.5 py-0.5 rounded-full">
                  EM BREVE
                </span>
              </div>

              <h3 className="font-display text-2xl font-bold text-white mb-2 tracking-tight">
                Criptomoedas Sem Risco de Estorno
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
                Receba em Bitcoin (BTC), Ethereum (ETH) e USDT diretamente na sua carteira. Pagamentos globais para quem vende licenças e códigos digitais para compradores do mundo inteiro.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
