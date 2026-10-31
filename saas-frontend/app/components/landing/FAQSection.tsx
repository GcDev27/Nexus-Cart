'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'O que é o NexusCart e como ele funciona?',
      a: 'O NexusCart é uma plataforma para criação de lojas focadas em produtos digitais, licenças de software e chaves seriais (keys). Você cadastra suas listas de chaves, conecta sua própria conta do Mercado Pago ou Efí Bank e, assim que o comprador paga via Pix, o sistema aprova o pedido e revela o serial imediatamente na tela.',
    },
    {
      q: 'O NexusCart cobra taxa ou porcentagem sobre as vendas?',
      a: 'Não. Você paga apenas o valor fixo da mensalidade do plano escolhido (a partir de R$ 20/mês). Todo o faturamento das suas vendas cai direto na sua conta do banco/gateway sem nenhuma retenção por parte do NexusCart.',
    },
    {
      q: 'É grátis para testar?',
      a: 'Sim! Você tem 7 dias de teste grátis em qualquer plano, sem necessidade de cadastrar cartão de crédito.',
    },
    {
      q: 'Como funciona o estoque e a entrega de chaves (keys)?',
      a: 'Você cadastra o produto e suas variações (por exemplo: Chave 30 Dias, Chave Anual, Chave Vitalícia) e insere uma lista de códigos. A cada Pix aprovado via webhook, uma linha é consumida e entregue ao comprador, sem risco de chaves duplicadas.',
    },
    {
      q: 'O que é a área "Minhas Compras"?',
      a: 'É o portal de autoatendimento nativo da sua loja (/minhas-compras). O comprador faz login com o e-mail utilizado na compra e tem acesso a todo o histórico de transações e chaves que adquiriu, evitando que você precise prestar suporte manual.',
    },
    {
      q: 'Preciso saber programar para personalizar o visual?',
      a: 'Não. Pelo painel de administração você escolhe entre 3 temas visuais (Dark Premium, Clean Light ou Gamer Neon), define as cores da sua marca com color picker, seleciona fontes do Google Fonts e faz upload da sua logo.',
    },
    {
      q: 'Quais gateways de pagamento são suportados?',
      a: 'Mercado Pago, Efí Bank (antiga Gerencianet), Asaas e Stripe. Todas as integrações são nativas e você só precisa colar suas chaves de API no painel.',
    },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 bg-[#090a0f] border-b border-white/[0.08]">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="font-mono text-[11px] uppercase tracking-widest text-neutral-400 mb-2">
            [ 05 // DÚVIDAS FREQUENTES ]
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            Respostas diretas sobre funcionamento, pagamentos e entrega automática.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-white/[0.08] bg-[#0f1017] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-white hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <span className="font-display tracking-tight">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-neutral-400 leading-relaxed border-t border-white/[0.04] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
