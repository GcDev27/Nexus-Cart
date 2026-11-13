import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="text-sm text-mist-dim">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <p>
          <span className="font-semibold">
            <span className="text-mist">Nexus</span>
            <span className="text-violet-hi">Cart</span>
          </span>
          <span className="ml-3">© {new Date().getFullYear()}</span>
        </p>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Rodapé">
          <a href="#como-funciona" className="hover:text-mist transition-colors">Como funciona</a>
          <a href="#precos" className="hover:text-mist transition-colors">Preços</a>
          <a href="#faq" className="hover:text-mist transition-colors">Dúvidas</a>
          <Link href="/termos" className="hover:text-mist transition-colors">Termos</Link>
          <Link href="/privacidade" className="hover:text-mist transition-colors">Privacidade</Link>
          <Link href="/login" className="hover:text-mist transition-colors">Entrar</Link>
          <Link href="/registro" className="text-mist hover:text-white transition-colors">Criar minha loja</Link>
        </nav>
      </div>
    </footer>
  );
}
