import React from 'react';

// Ícone Oficial do PIX (Banco Central do Brasil)
export function PixIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M112.56 123.08L225.8 236.32C233.6 244.12 244.2 248.52 255.24 248.52C266.28 248.52 276.88 244.12 284.68 236.32L397.92 123.08C414.28 106.72 414.28 80.2 397.92 63.84L383.16 49.08C366.8 32.72 340.28 32.72 323.92 49.08L269.96 103.04C261.88 111.12 248.6 111.12 240.52 103.04L186.56 49.08C170.2 32.72 143.68 32.72 127.32 49.08L112.56 63.84C96.2 80.2 96.2 106.72 112.56 123.08ZM397.92 388.92L284.68 275.68C276.88 267.88 266.28 263.48 255.24 263.48C244.2 263.48 233.6 267.88 225.8 275.68L112.56 388.92C96.2 405.28 96.2 431.8 112.56 448.16L127.32 462.92C143.68 479.28 170.2 479.28 186.56 462.92L240.52 408.96C248.6 400.88 261.88 400.88 269.96 408.96L323.92 462.92C340.28 479.28 366.8 479.28 383.16 462.92L397.92 448.16C414.28 431.8 414.28 405.28 397.92 388.92ZM49.08 323.92L103.04 269.96C111.12 261.88 111.12 248.6 103.04 240.52L49.08 186.56C32.72 170.2 32.72 143.68 49.08 127.32L63.84 112.56C80.2 96.2 106.72 96.2 123.08 112.56L236.32 225.8C244.12 233.6 248.52 244.2 248.52 255.24C248.52 266.28 244.12 276.88 236.32 284.68L123.08 397.92C106.72 414.28 80.2 414.28 63.84 397.92L49.08 383.16C32.72 366.8 32.72 340.28 49.08 323.92ZM462.92 186.56L408.96 240.52C400.88 248.6 400.88 261.88 408.96 269.96L462.92 323.92C479.28 340.28 479.28 366.8 462.92 383.16L448.16 397.92C431.8 414.28 405.28 414.28 388.92 397.92L275.68 284.68C267.88 276.88 263.48 266.28 263.48 255.24C263.48 244.2 267.88 233.6 275.68 225.8L388.92 112.56C405.28 96.2 431.8 96.2 448.16 112.56L462.92 127.32C479.28 143.68 479.28 170.2 462.92 186.56Z" 
      />
    </svg>
  );
}

// Ícone Oficial do Mercado Pago
export function MercadoPagoIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#009EE3" />
      {/* Símbolo clássico de aperto de mãos do Mercado Pago */}
      <path 
        d="M14 26C14 26 18.5 22 22 25.5C25.5 29 28.5 27 30 25.5C31.5 24 33 24 34 25C35 26 34 27.5 32.5 29C31 30.5 26.5 33.5 23 30.5C19.5 27.5 17 29.5 14 26Z" 
        fill="white" 
      />
      <path 
        d="M20 20C21.5 18.5 24.5 18 26 19.5C27.5 21 28 22.5 27 23.5C26 24.5 24 24 23 23C22 22 20.5 21 20 20Z" 
        fill="white" 
      />
      <circle cx="21" cy="18" r="2.5" fill="#FFE600" />
      <circle cx="27" cy="18" r="2.5" fill="#FFE600" />
    </svg>
  );
}

// Ícone Oficial do Efí Bank (Gerencianet)
export function EfiBankIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#F37021" />
      {/* Monograma oficial efí */}
      <text 
        x="24" 
        y="30" 
        fontFamily="sans-serif" 
        fontWeight="800" 
        fontSize="18" 
        fill="white" 
        textAnchor="middle" 
        letterSpacing="-1"
      >
        efí
      </text>
    </svg>
  );
}

// Ícone Oficial do Asaas
export function AsaasIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#0030B9" />
      {/* Logo A estilizado do Asaas */}
      <path 
        d="M24 12L34 32H28.5L26.5 27.5H21.5L19.5 32H14L24 12ZM24 18.5L22.5 23.5H25.5L24 18.5Z" 
        fill="white" 
      />
    </svg>
  );
}

// Ícone Oficial da Stripe
export function StripeIcon({ className = "w-5 h-5", size = 20 }: { className?: string; size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="48" rx="12" fill="#635BFF" />
      {/* "S" da Stripe */}
      <path 
        d="M26.2 20.3C24.4 19.8 23.2 19.3 23.2 18.3C23.2 17.3 24.3 16.6 25.8 16.6C27.9 16.6 30.1 17.3 31.8 18.2V13.8C29.9 12.9 27.8 12.5 25.7 12.5C20.9 12.5 17.7 15.1 17.7 19C17.7 23.7 23.3 24.6 25.2 25.2C27.2 25.8 28.1 26.5 28.1 27.6C28.1 28.7 26.8 29.5 25.2 29.5C22.8 29.5 20.3 28.4 18.4 27.2V31.8C20.6 32.9 23 33.5 25.3 33.5C30.3 33.5 33.7 30.9 33.7 26.8C33.7 21.8 28.2 20.9 26.2 20.3Z" 
        fill="white" 
      />
    </svg>
  );
}

// Componente dinâmico que renderiza o logo correto de acordo com o provedor
export function GatewayLogo({ 
  provider, 
  className = "w-6 h-6", 
  size = 24 
}: { 
  provider: 'MERCADO_PAGO' | 'EFI_BANK' | 'ASAAS' | 'STRIPE' | string; 
  className?: string; 
  size?: number; 
}) {
  switch (provider) {
    case 'MERCADO_PAGO':
      return <MercadoPagoIcon className={className} size={size} />;
    case 'EFI_BANK':
      return <EfiBankIcon className={className} size={size} />;
    case 'ASAAS':
      return <AsaasIcon className={className} size={size} />;
    case 'STRIPE':
      return <StripeIcon className={className} size={size} />;
    default:
      return null;
  }
}

