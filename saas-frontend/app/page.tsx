import React from 'react';
import SmoothScroll from './components/landing/SmoothScroll';
import LandingNavbar from './components/landing/LandingNavbar';
import HeroSection from './components/landing/HeroSection';
import HowItWorks from './components/landing/HowItWorks';
import PinnedCarouselSection from './components/landing/PinnedCarouselSection';
import PaymentMethodsSection from './components/landing/PaymentMethodsSection';
import PricingSection from './components/landing/PricingSection';
import FAQSection from './components/landing/FAQSection';
import LandingCTA from './components/landing/LandingCTA';
import LandingFooter from './components/landing/LandingFooter';

export const metadata = {
  title: 'NexusCart | Loja de keys com entrega automática no Pix',
  description:
    'Monte sua loja de keys, licenças e produtos digitais. Quando o Pix cai na sua conta do Mercado Pago, o comprador recebe a chave na hora. Teste 7 dias grátis, sem cartão.',
};

export default function PlatformLandingPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-ink text-mist overflow-x-hidden font-sans">
        <LandingNavbar />
        <HeroSection />
        <HowItWorks />
        <PinnedCarouselSection />
        <PaymentMethodsSection />
        <PricingSection />
        <FAQSection />
        <LandingCTA />
        <LandingFooter />
      </main>
    </SmoothScroll>
  );
}
