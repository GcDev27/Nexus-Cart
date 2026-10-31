'use client';

import React from 'react';
import { Check, Key, Zap } from 'lucide-react';

export default function CentralDashboardMockup() {
  return (
    <div className="relative w-full rounded-2xl border border-white/[0.12] bg-[#0c0d12]/95 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.85)] overflow-hidden select-none">
      
      {/* Top Browser / Window Chrome Bar */}
      <div className="h-10 sm:h-11 bg-[#121319] border-b border-white/[0.08] px-4 sm:px-6 flex items-center justify-between">
        {/* macOS style window buttons */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/80" />
          
          <div className="hidden sm:flex items-center gap-2 ml-4 px-3 py-0.5 rounded-md bg-white/[0.04] border border-white/6 text-[10px] text-neutral-400 font-mono">
            <span>nexuscart.com/dashboard/operacional</span>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE // 99.98% UPTIME
          </span>
        </div>
      </div>

      {/* Dashboard Canvas Preview - Real UI representation with Interactive Highlights */}
      <div className="relative bg-[#090a0f]">
        
        {/* Embedded High-Res Dashboard Screenshot */}
        <div className="relative overflow-hidden">
          <img
            src="/dashboard-preview.png"
            alt="NexusCart Dashboard Operacional de Vendas"
            className="w-full h-auto object-cover block"
            loading="eager"
          />

          {/* Interactive Floating Micro-Cards (High-End Editorial Style) */}
          {/* Badge 1: Pix Liquidado */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-[#0c0d13]/90 backdrop-blur-xl border border-white/[0.12] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center gap-3 transition-transform hover:scale-105 duration-200 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-3.5 h-3.5 fill-emerald-400/30" />
            </div>
            <div className="text-left font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">Pix Liquidado</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-semibold">+R$ 199,00</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Webhook 200 OK • Entrega 2.1s
              </span>
            </div>
          </div>

          {/* Badge 2: Chave Serial Entregue */}
          <div className="hidden md:flex absolute bottom-6 left-6 bg-[#0c0d13]/90 backdrop-blur-xl border border-white/[0.12] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] items-center gap-3 transition-transform hover:scale-105 duration-200 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Key className="w-3.5 h-3.5" />
            </div>
            <div className="text-left font-sans">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-white">Linha de Estoque Consumida</span>
                <span className="text-[10px] bg-white/10 text-neutral-300 px-1.5 py-0.2 rounded font-mono">1.287 chaves</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono mt-0.5 block">
                Chave NX-9942-PRO liberada
              </span>
            </div>
          </div>

          {/* Soft Bottom Gradient Vignette */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/40 to-transparent" />
        </div>

      </div>

    </div>
  );
}
