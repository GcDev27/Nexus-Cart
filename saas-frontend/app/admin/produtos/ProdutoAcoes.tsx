"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useToast } from "../../components/Toast";
import { getToken, authFetch } from "../../lib/auth";

interface ProdutoAcoesProps {
  produtoId: number;
  onDeleteSuccess: (id: number) => void;
}

// ─── Hook: useClickOutside ───────────────────────────────────────
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

// ─── Hook: useDialog (motion.dev/examples/react-modal pattern) ──
function useDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    // Wait for AnimatePresence to render, then show as modal
    requestAnimationFrame(() => {
      dialogRef.current?.showModal();
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Let exit animation play before closing the native dialog
    setTimeout(() => {
      dialogRef.current?.close();
    }, 200);
  }, []);

  return { isOpen, open, close, dialogRef };
}

export default function ProdutoAcoes({ produtoId, onDeleteSuccess }: ProdutoAcoesProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();
  const { isOpen: dialogOpen, open: openDialog, close: closeDialog, dialogRef } = useDialog();
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Fecha o modal ao clicar fora do conteúdo
  useClickOutside(modalContentRef, () => {
    if (dialogOpen) closeDialog();
  });

  const openDeleteModal = () => {
    setIsMenuOpen(false);
    openDialog();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = getToken();
      const res = await authFetch(`/api/admin/produtos/${produtoId}`, {
        method: "DELETE"
      });
      
      if (res.ok) {
        closeDialog();
        onDeleteSuccess(produtoId);
        addToast("Produto apagado com sucesso!", "success");
      } else {
        addToast("Erro ao apagar o produto.", "error");
      }
    } catch (error) {
      console.error("Erro ao apagar", error);
      addToast("Falha de comunicação com o servidor.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      {/* Botão dos Três Pontos */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-neutral-500 hover:text-white transition-colors p-2 rounded-md hover:bg-neutral-800"
      >
        •••
      </button>

      {/* ANIMATED MENU (react-base-menu concept) */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Overlay invisível para fechar o menu ao clicar fora */}
            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-48 bg-[#171717] border border-neutral-800 rounded-xl shadow-xl z-20 overflow-hidden"
            >
              <Link href={`/admin/produtos/${produtoId}/editar`} className="block px-4 py-3 text-sm text-neutral-300 hover:bg-[#202020] hover:text-white transition-colors">
                Editar produto
              </Link>
              <button 
                onClick={openDeleteModal}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors border-t border-neutral-800"
              >
                Apagar produto
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG (react-modal concept - using native <dialog>) */}
      <AnimatePresence>
        {dialogOpen && (
          <dialog
            ref={dialogRef}
            className="fixed inset-0 z-50 bg-transparent backdrop:bg-transparent p-0 m-0 max-w-none max-h-none w-full h-full overflow-hidden"
            onCancel={(e) => {
              e.preventDefault();
              closeDialog();
            }}
          >
            <div className="fixed inset-0 flex items-center justify-center">
              {/* Backdrop animado */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => closeDialog()}
              />
              
              {/* Modal Content - spring animation */}
              <motion.div
                ref={modalContentRef}
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 1,
                }}
                className="relative bg-[#171717] border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              >
                {/* Ícone de alerta */}
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">Apagar Produto</h3>
                <p className="text-neutral-400 text-sm mb-6">
                  Tem a certeza que deseja apagar este produto? Esta ação não pode ser desfeita e o item será removido da sua loja.
                </p>
                
                <div className="flex justify-end gap-3">
                  <motion.button 
                    onClick={() => closeDialog()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-300 hover:text-white bg-neutral-800/50 hover:bg-neutral-800 transition-colors border border-neutral-700/50"
                  >
                    Cancelar
                  </motion.button>
                  <motion.button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block"
                        >
                          ⏳
                        </motion.span>
                        A apagar...
                      </>
                    ) : (
                      "Sim, apagar"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
