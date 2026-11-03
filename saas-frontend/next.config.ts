import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com só o necessário para rodar: deixa a imagem Docker pequena
  output: "standalone",
};

export default nextConfig;
