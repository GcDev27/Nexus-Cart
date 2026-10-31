'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'O que dá para vender no NexusCart?',
    a: 'Produtos digitais em geral: keys de jogos e servidores, licenças de software, contas de acesso, gift cards e cursos. Se o produto é uma chave ou um código, a entrega é automática. Se não for, você pode usar a entrega manual com uma mensagem para o comprador.',
  },
  {
    q: 'O NexusCart fica com alguma porcentagem das vendas?',
    a: 'Não. Você paga só a mensalidade do plano. O Pix é cobrado na sua conta do Mercado Pago, e só as taxas do próprio Mercado Pago são descontadas.',
  },
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você cria a loja e usa qualquer plano por 7 dias, sem cadastrar cartão de crédito.',
  },
  {
    q: 'Como as chaves são entregues?',
    a: 'Cada variação do produto (por exemplo 30 dias, 90 dias e vitalícia) tem a sua lista de chaves. Quando um Pix é aprovado, a próxima chave da lista é marcada como entregue e aparece na tela do comprador. A mesma chave nunca é entregue duas vezes.',
  },
  {
    q: 'E se o comprador fechar a página antes de copiar a chave?',
    a: 'Se ele comprou logado, a chave fica salva em "Minhas compras", a área do comprador da sua loja. Por isso vale incentivar o cadastro antes da compra.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Hoje, Pix pela sua conta do Mercado Pago. Efí Bank, Asaas e cartão de crédito estão em desenvolvimento.',
  },
  {
    q: 'Preciso saber programar para personalizar a loja?',
    a: 'Não. No painel você escolhe entre três temas (Dark Premium, Clean Light e Gamer Neon), a cor de destaque, a fonte, o texto de abertura e o logo da loja.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b border-ink-line scroll-mt-16">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28 grid lg:grid-cols-12 gap-10 lg:gap-16">
        <h2 className="lg:col-span-4 text-3xl sm:text-[2.6rem] font-semibold tracking-[-0.025em] text-mist leading-tight">
          Dúvidas frequentes
        </h2>

        <div className="lg:col-span-8 divide-y divide-ink-line border-y border-ink-line">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `faq-panel-${idx}`;

            return (
              <div key={faq.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full py-5 text-left flex items-center justify-between gap-4 text-base sm:text-[17px] font-medium text-mist hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi rounded"
                  >
                    {faq.q}
                    <ChevronDown
                      aria-hidden
                      className={`w-5 h-5 text-mist-dim shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </h3>
                {isOpen && (
                  <p id={panelId} className="pb-6 pr-8 text-[15px] leading-relaxed text-mist-dim max-w-[62ch]">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
