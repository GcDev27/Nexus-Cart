import type { Metadata } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "./components/Toast";
import "./globals.css";

// Uma família só para a interface; a mono fica reservada para chaves e códigos Pix
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "NexusCart • Plataforma para Vender Produtos Digitais",
  description: "Crie sua loja de produtos digitais, licenças e chaves seriais com entrega automática e Pix instantâneo direto na sua conta bancária.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/nexuscart-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${onest.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-ink text-mist selection:bg-violet/40 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
