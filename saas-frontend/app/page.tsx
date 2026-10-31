import React from 'react';
import SmoothScroll from './components/landing/SmoothScroll';
import LandingNavbar from './components/landing/LandingNavbar';
import HeroSection from './components/landing/HeroSection';
import MetricsBar from './components/landing/MetricsBar';
import PinnedCarouselSection from './components/landing/PinnedCarouselSection';
import PaymentMethodsSection from './components/landing/PaymentMethodsSection';
import PricingSection from './components/landing/PricingSection';
import FAQSection from './components/landing/FAQSection';
import LandingCTA from './components/landing/LandingCTA';
import LandingFooter from './components/landing/LandingFooter';

export const metadata = {
  title: 'Crie sua loja de produtos digitais em poucos minutos | NexusCart',
  description:
    'Crie sua loja de produtos digitais ou para o seu servidor de FiveM, Minecraft e muito mais, com entrega automática e Pix aprovado na hora. Teste 7 dias grátis, sem cartão.',
};

export default function PlatformLandingPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-[#090a0f] text-[#ededed] selection:bg-white/20 selection:text-white overflow-x-hidden font-sans">
        {/* Minimal Modern Header */}
        <LandingNavbar />

        {/* Hero Section com Headline Direto e Dashboard Mockup */}
        <HeroSection />

        {/* Barra de Métricas Reais */}
        <MetricsBar />

        {/* Carrossel Pinned Horizontal estilo Primora & CentralCart */}
        <PinnedCarouselSection />

        {/* Seção de Métodos de Pagamento (Pix, Cartão, Cripto) */}
        <PaymentMethodsSection />

        {/* Planos Transparentes (R$ 20, R$ 40, R$ 70) */}
        <PricingSection />

        {/* FAQ com as dúvidas reais dos lojistas */}
        <FAQSection />

        {/* CTA Final */}
        <LandingCTA />

        {/* Rodapé Minimalista */}
        <LandingFooter />
      </main>
    </SmoothScroll>
  );
}