'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MotionCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export default function MotionCheckbox({
  checked,
  onChange,
  label,
  id,
  className = '',
  disabled = false,
}: MotionCheckboxProps) {
  return (
    <label
      htmlFor={id}
      onClick={(e) => {
        if (disabled) return;
        e.preventDefault();
        onChange(!checked);
      }}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none group ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      <motion.div
        whileTap={{ scale: disabled ? 1 : 0.88 }}
        animate={{
          backgroundColor: checked ? 'var(--color-brand, #8b5cf6)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: checked ? 'var(--color-brand, #8b5cf6)' : 'rgba(255, 255, 255, 0.15)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-md border flex items-center justify-center shrink-0 relative overflow-hidden transition-colors shadow-sm group-hover:border-white/30"
      >
        <svg
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3 text-white pointer-events-none"
        >
          <motion.path
            d="M2.5 7.5L5.5 10.5L11.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 600,
              damping: 35,
            }}
          />
        </svg>
      </motion.div>
      {label && <span className="text-xs sm:text-sm text-zinc-300 group-hover:text-white transition-colors">{label}</span>}
    </label>
  );
}
