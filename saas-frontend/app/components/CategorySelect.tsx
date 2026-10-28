"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, ChevronDown, Check, Plus, FolderPlus } from "lucide-react";
import { authFetch } from "../lib/auth";
import MotionModal from "./motion/MotionModal";

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  label?: string;
  required?: boolean;
}

const STORAGE_KEY = "saas_tenant_categories";

export function getStoredCategories(): string[] {
  if (typeof window === "undefined") return ["Geral"];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return ["Geral"];
}

export function saveStoredCategories(categories: string[]) {
  if (typeof window === "undefined") return;
  try {
    const unique = Array.from(new Set(categories.map((c) => c.trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
  } catch {
    // ignore
  }
}

export default function CategorySelect({
  value,
  onChange,
  label = "Categoria do Produto",
  required = false,
}: CategorySelectProps) {
  const [categories, setCategories] = useState<string[]>(["Geral"]);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carrega categorias salvas localmente + produtos do backend
  useEffect(() => {
    async function loadCategories() {
      const stored = getStoredCategories();
      const set = new Set<string>(stored);

      try {
        const res = await authFetch("/api/admin/produtos");
        if (res.ok) {
          const prods = await res.json();
          if (Array.isArray(prods)) {
            prods.forEach((p: any) => {
              if (p.categoryName && typeof p.categoryName === "string" && p.categoryName.trim()) {
                set.add(p.categoryName.trim());
              }
            });
          }
        }
      } catch {
        // Fallback para as salvas
      }

      if (value && value.trim()) {
        set.add(value.trim());
      }

      const merged = Array.from(set);
      if (!merged.includes("Geral")) {
        merged.unshift("Geral");
      }
      setCategories(merged);
      saveStoredCategories(merged);
    }

    loadCategories();
  }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const next = Array.from(new Set([...categories, trimmed]));
    setCategories(next);
    saveStoredCategories(next);
    onChange(trimmed);
    setNewCategoryName("");
    setIsModalOpen(false);
    setIsOpen(false);
  };

  const selectedLabel = value || "Geral";

  return (
    <div className="flex flex-col gap-1.5" ref={dropdownRef}>
      {/* Label e Botão Nova Categoria */}
      <div className="flex items-center justify-between">
        <label className="text-xs sm:text-sm font-medium text-on-surface flex items-center gap-1">
          {label} {required && <span className="text-error">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setIsModalOpen(true);
          }}
          className="text-[11px] text-primary hover:text-primary-hover font-semibold transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nova categoria</span>
        </button>
      </div>

      {/* Seletor Customizado com Motion */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-2 bg-surface-container text-on-surface text-xs sm:text-sm px-3.5 py-2.5 rounded-lg border transition-all text-left ${
            isOpen 
              ? "border-primary ring-1 ring-primary/40 bg-surface-container-high" 
              : "border-surface-container-high/40 hover:border-surface-container-high hover:bg-surface-container-high/60"
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Tag className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate font-medium">{selectedLabel}</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-outline shrink-0"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        {/* Menu Suspenso Animado com Motion */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -4 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className="absolute left-0 right-0 mt-1.5 bg-[#141419]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 overflow-hidden max-h-60 overflow-y-auto"
            >
              <div className="space-y-0.5">
                {categories.map((cat) => {
                  const isSelected = (value || "Geral") === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onChange(cat);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isSelected
                          ? "bg-primary/15 text-primary font-semibold"
                          : "text-zinc-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Tag className="w-3.5 h-3.5 opacity-60" />
                        <span className="truncate">{cat}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </button>
                  );
                })}

                {/* Opção de Criar no fim do Dropdown */}
                <div className="pt-1 mt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors text-left"
                  >
                    <FolderPlus className="w-4 h-4 text-primary shrink-0" />
                    <span>+ Criar nova categoria...</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal Elegante para Criar Nova Categoria */}
      <MotionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewCategoryName("");
        }}
        title="Criar Nova Categoria"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Informe o nome da categoria para organizar seus produtos na vitrine da loja.
          </p>

          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Nome da Categoria
            </label>
            <input
              type="text"
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateCategory();
                } else if (e.key === "Escape") {
                  setIsModalOpen(false);
                  setNewCategoryName("");
                }
              }}
              placeholder="Ex: Assinaturas, Cursos, Licenças..."
              className="w-full bg-[#0d0e12] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setNewCategoryName("");
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleCreateCategory()}
              disabled={!newCategoryName.trim()}
              className="px-4 py-2 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all hover:bg-primary-hover disabled:opacity-50 shadow-md shadow-primary/20"
            >
              Criar Categoria
            </button>
          </div>
        </div>
      </MotionModal>
    </div>
  );
}
