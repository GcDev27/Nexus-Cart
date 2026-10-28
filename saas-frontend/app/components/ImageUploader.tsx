'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, RefreshCw, Check } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (base64Url: string) => void;
  label?: string;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  maxDimension?: number;
}

/**
 * Utilitário para comprimir e converter uma imagem local para Base64 WebP/JPEG
 */
async function compressImageFile(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Tenta exportar em webp, fallback para jpeg
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // ignore
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo do dispositivo'));
    reader.readAsDataURL(file);
  });
}

export default function ImageUploader({
  value,
  onChange,
  label = 'Imagem',
  helperText = 'Formatos suportados: PNG, JPG, WEBP, GIF.',
  aspectRatio = 'video',
  maxDimension = 1200,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecione um arquivo de imagem válido.');
      return;
    }

    // Limite de 15MB para upload inicial antes da compressão
    if (file.size > 15 * 1024 * 1024) {
      setError('A imagem deve ter menos de 15MB.');
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const compressedBase64 = await compressImageFile(file, maxDimension);
      onChange(compressedBase64);
    } catch (err: any) {
      console.error('Erro ao processar imagem:', err);
      setError('Não foi possível carregar a imagem. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const ratioClass = 
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === 'video' ? 'aspect-video' : 'min-h-[160px]';

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs sm:text-sm font-medium text-on-surface flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            <span>{label}</span>
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-[11px] text-error hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Remover</span>
            </button>
          )}
        </div>
      )}

      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />

      {/* Preview or Dropzone */}
      {value ? (
        <div className={`relative w-full ${ratioClass} rounded-xl bg-surface-container-lowest border border-surface-container-high/60 overflow-hidden group shadow-sm flex items-center justify-center`}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-1.5 border border-white/20 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Trocar do Dispositivo</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 border border-red-400/40 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Excluir</span>
            </button>
          </div>

          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] text-emerald-400 font-medium flex items-center gap-1 border border-emerald-500/30">
            <Check className="w-2.5 h-2.5" />
            <span>Carregada</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full ${ratioClass} rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 p-4 text-center select-none ${
            isDragging
              ? 'border-primary bg-primary/10 text-primary scale-[1.01]'
              : 'border-surface-container-high/80 bg-surface-container-lowest hover:border-primary/60 hover:bg-surface-container-low text-outline hover:text-on-surface'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs font-medium text-primary">Processando e otimizando imagem...</span>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs sm:text-sm font-semibold text-on-surface">
                  Clique para escolher do seu dispositivo
                </span>
                <span className="text-[11px] text-outline">
                  ou arraste e solte o arquivo aqui
                </span>
              </div>
              <span className="text-[10px] text-outline/80 mt-1">
                {helperText}
              </span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-error font-medium">{error}</p>
      )}
    </div>
  );
}
