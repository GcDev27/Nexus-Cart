'use client';

import React from 'react';
import Image from 'next/image';
import { Check, KeyRound } from 'lucide-react';

export default function CentralDashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl border border-ink-line bg-ink-raised shadow-[0_30px_100px_-20px_rgba(104,62,222,0.45)] overflow-hidden select-none">
      {/* Barra da janela */}
      <div className="h-10 sm:h-11 bg-ink-raised border-b border-ink-line px-4 sm:px-5 flex items-center gap-4">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
        </div>
        <div className="hidden sm:block flex-1 max-w-xs mx-auto rounded-md bg-ink border border-ink-line px-3 py-1 text-[11px] text-mist-dim text-center">
          nexuscart.com/admin
        </div>
      </div>

      <div className="relative bg-ink">
        <Image
          src="/dashboard-preview.png"
          alt="Painel do NexusCart com faturamento, pedidos e gráfico de vendas"
          width={1024}
          height={610}
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="w-full h-auto block"
          priority
        />

        {/* Notificações que aparecem quando o painel termina de levantar */}
        <div className="mock-badge absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 rounded-xl border border-ink-line bg-ink-raised/95 backdrop-blur-xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-paid/15 text-paid shrink-0">
            <Check className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <span className="text-left">
            <span className="block text-xs font-semibold text-mist">Pix recebido</span>
            <span className="block text-[11px] text-mist-dim mt-0.5">Key VIP 30 dias, R$ 24,90</span>
          </span>
        </div>

        <div className="mock-badge hidden md:flex absolute bottom-8 left-6 items-center gap-3 rounded-xl border border-ink-line bg-ink-raised/95 backdrop-blur-xl p-3 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet/20 text-violet-hi shrink-0">
            <KeyRound className="w-4 h-4" />
          </span>
          <span className="text-left">
            <span className="block text-xs font-semibold text-mist">Chave entregue ao comprador</span>
            <span className="block font-mono text-[11px] text-mist-dim mt-0.5">VIP-7KQ2-9XMP-4RLA</span>
          </span>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      </div>
    </div>
  );
}
