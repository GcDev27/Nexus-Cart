'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const DEMO_KEY = 'VIP-7KQ2-9XMP-4RLA';
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// QR ilustrativo: padrão determinístico com os três "olhos" de um QR real
function useQrCells(size = 25, seed = 7) {
  return useMemo(() => {
    let s = seed;
    const rand = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    const isFinder = (x: number, y: number) => {
      const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
      return inBox(0, 0) || inBox(size - 7, 0) || inBox(0, size - 7);
    };
    const finderOn = (x: number, y: number) => {
      const lx = x >= size - 7 ? x - (size - 7) : x;
      const ly = y >= size - 7 ? y - (size - 7) : y;
      const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
      const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
      return ring || core;
    };
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const on = isFinder(x, y) ? finderOn(x, y) : rand() > 0.52;
        if (on) cells.push({ x, y });
      }
    }
    return cells;
  }, [size, seed]);
}

export default function PixDemo() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [paid, setPaid] = useState(false);
  const [displayKey, setDisplayKey] = useState(DEMO_KEY);
  const [copied, setCopied] = useState(false);
  const qrCells = useQrCells();

  // Roda quando o comprovante aparece (paid = true), já com o DOM montado
  useGSAP(
    () => {
      if (!paid) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const tl = gsap.timeline();

      // O comprovante "sai da impressora": revela de cima para baixo
      tl.fromTo(
        '.pix-receipt',
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power2.out' }
      );

      tl.from('.pix-check', { scale: 0, duration: 0.35, ease: 'back.out(2.5)' }, '-=0.35');

      // A chave embaralha até assentar no valor real
      const state = { progress: 0 };
      tl.to(
        state,
        {
          progress: 1,
          duration: 0.9,
          ease: 'none',
          onUpdate: () => {
            const settled = Math.floor(state.progress * DEMO_KEY.length);
            setDisplayKey(
              DEMO_KEY.split('')
                .map((char, i) =>
                  char === '-' || i < settled
                    ? char
                    : KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)]
                )
                .join('')
            );
          },
          onComplete: () => setDisplayKey(DEMO_KEY),
        },
        '-=0.1'
      );
    },
    { scope: rootRef, dependencies: [paid] }
  );

  const runPayment = () => {
    setPaid(true);
    setCopied(false);
  };

  const reset = () => {
    setPaid(false);
    setCopied(false);
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(DEMO_KEY);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-[400px] mx-auto">
      {/* Fita da logo: o único lugar da página com o gradiente da marca */}
      <div
        aria-hidden
        className="absolute -inset-px rounded-[22px] bg-gradient-to-br from-violet-hi via-violet to-violet-lo opacity-90"
      />

      <div className="relative rounded-[21px] bg-ink-raised p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-ink-line">
          <div>
            <p className="text-xs text-mist-dim">Loja de demonstração</p>
            <p className="mt-1 text-[15px] font-semibold text-mist">Key VIP 30 dias</p>
          </div>
          <p className="text-[15px] font-semibold text-mist whitespace-nowrap">R$ 24,90</p>
        </div>

        <div className="pt-5 min-h-[318px]" aria-live="polite">
          {!paid ? (
            <div>
              <div className="flex gap-4 items-center">
                <svg
                  viewBox="-2 -2 29 29"
                  className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-lg bg-receipt p-1.5"
                  role="img"
                  aria-label="QR Code do Pix (ilustrativo)"
                >
                  {qrCells.map((c) => (
                    <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width="1.02" height="1.02" fill="#111217" />
                  ))}
                </svg>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm text-mist">
                    <span className="relative flex w-2 h-2">
                      <span className="absolute inset-0 rounded-full bg-violet-hi motion-safe:animate-ping opacity-60" />
                      <span className="relative w-2 h-2 rounded-full bg-violet-hi" />
                    </span>
                    Aguardando o Pix
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-mist-dim">
                    O comprador escaneia o QR Code ou usa o Pix copia e cola.
                  </p>
                </div>
              </div>

              <p className="mt-4 font-mono text-[11px] text-mist-dim truncate rounded-md bg-ink px-3 py-2 border border-ink-line">
                00020126580014br.gov.bcb.pix0136a8f3c9e2-41d7
              </p>

              <button
                type="button"
                onClick={runPayment}
                className="mt-5 w-full rounded-lg bg-violet hover:bg-violet-hi text-white text-sm font-semibold py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
              >
                Simular pagamento
              </button>
            </div>
          ) : (
            <div>
              <div className="pix-receipt rounded-xl bg-receipt text-ink p-5">
                <div className="flex items-center gap-3">
                  <span className="pix-check flex items-center justify-center w-8 h-8 rounded-full bg-paid text-ink">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Pagamento confirmado</p>
                    <p className="text-xs text-ink/60">R$ 24,90 pagos via Pix</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-dashed border-ink/20">
                  <p className="text-xs text-ink/60">Sua chave</p>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    {/* O embaralhamento é só visual; o leitor de tela recebe a chave final */}
                    <span aria-hidden className="font-mono text-[15px] sm:text-base font-medium tracking-wide">
                      {displayKey}
                    </span>
                    <span className="sr-only">{DEMO_KEY}</span>
                    <button
                      type="button"
                      onClick={copyKey}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-violet-lo hover:text-violet rounded px-1 focus-visible:outline-2 focus-visible:outline-violet"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copiada' : 'Copiar'}
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-mist-dim">
                A chave sai do seu estoque e também fica salva em &quot;Minhas compras&quot; para o comprador.
              </p>

              <button
                type="button"
                onClick={reset}
                className="mt-5 w-full rounded-lg border border-ink-line hover:border-mist-dim text-mist text-sm font-medium py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-hi"
              >
                Ver de novo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
