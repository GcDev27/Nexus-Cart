'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingFooter() {
  return (
    <footer className="bg-[#090a0f] text-neutral-400 text-xs sm:text-sm py-14">
      <div className="max-w-6xl mx-auto px-6">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden">
              <Image
                src="/nexuscart-icon.png"
                alt="NexusCart"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
            <span className="font-display font-bold text-white text-base">NexusCart</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-400 font-medium">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#pagamentos" className="hover:text-white transition-colors">Pagamentos</a>
            <a href="#precos" className="hover:text-white transition-colors">Preços</a>
            <a href="#faq" className="hover:text-white transition-colors">Dúvidas</a>
            <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
            <Link href="/registro" className="text-white hover:underline">Criar Loja Grátis</Link>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-neutral-400">
          <span>&copy; {new Date().getFullYear()} NEXUSCART TECNOLOGIA. TODOS OS DIREITOS RESERVADOS.</span>
          <span>LIQUIDAÇÃO DIRETA • PRODUTOS DIGITAIS & LICENÇAS</span>
        </div>

      </div>
    </footer>
  );
}
