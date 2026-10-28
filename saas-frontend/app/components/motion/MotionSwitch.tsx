'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MotionSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function MotionSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: MotionSwitchProps) {
  const isSm = size === 'sm';
  const width = isSm ? 'w-8 h-4.5' : 'w-11 h-6';
  const thumbSize = isSm ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5';
  const translateX = isSm ? 14 : 20;

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <div
        className={`${width} rounded-full p-0.5 flex items-center transition-colors duration-200 ${
          checked ? 'bg-[var(--color-brand,#8b5cf6)]' : 'bg-white/10'
        } border border-white/10 shadow-inner`}
      >
        <motion.div
          animate={{ x: checked ? translateX : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
          className={`${thumbSize} bg-white rounded-full shadow-md`}
        />
      </div>
      {label && <span className="text-xs sm:text-sm text-zinc-300 font-medium">{label}</span>}
    </div>
  );
}
