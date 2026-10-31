'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export type StoreSelectOption<T extends string> = { value: T; label: string };

/**
 * Seletor da vitrine no lugar do <select> nativo, cuja lista aberta usa as cores do sistema
 * e fica ilegível nos temas escuros. Segue as variáveis do tema da loja.
 */
export default function StoreSelect<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: StoreSelectOption<T>[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const reduceMotion = useReducedMotion();

  const selected = options.find((o) => o.value === value) ?? options[0];

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const openList = () => {
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (index: number) => {
    onChange(options[index].value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(activeIndex);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 text-sm">
      <span className="hidden sm:inline text-[var(--text-secondary)]" id={`${listId}-label`}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label ${listId}-value`}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="flex items-center justify-between gap-3 min-w-[9.5rem] px-3.5 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] text-[var(--text-primary)] font-medium transition-colors outline-none focus-visible:border-[var(--color-brand)]"
        style={{ borderRadius: 'var(--store-radius-sm)' }}
      >
        <span id={`${listId}-value`}>{selected.label}</span>
        <ChevronDown
          aria-hidden
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-labelledby={`${listId}-label`}
            aria-activedescendant={`${listId}-opt-${activeIndex}`}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full mt-2 z-50 w-52 p-1.5 bg-[var(--bg-popover)] border border-[var(--border-color)] shadow-2xl backdrop-blur-xl origin-top-right"
            style={{ borderRadius: 'var(--store-radius-sm)' }}
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              const isActive = i === activeIndex;
              return (
                <li
                  key={opt.value}
                  id={`${listId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActiveIndex(i)}
                  onClick={() => choose(i)}
                  className={`flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors ${
                    isSelected ? 'font-semibold' : 'text-[var(--text-secondary)]'
                  } ${isActive ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]' : ''}`}
                  style={{
                    borderRadius: 'calc(var(--store-radius-sm) - 2px)',
                    ...(isSelected ? { color: 'var(--color-brand)', background: 'color-mix(in srgb, var(--color-brand) 12%, transparent)' } : {}),
                  }}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden />}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
