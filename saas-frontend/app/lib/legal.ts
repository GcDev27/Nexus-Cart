// Dados do responsável pelo NexusCart, usados nos Termos de uso e na Política de privacidade.
// Preencha antes de publicar: a LGPD exige identificar o controlador e um canal de contato.
export const LEGAL = {
  /** Nome completo (pessoa física) ou razão social. */
  operator: process.env.NEXT_PUBLIC_LEGAL_OPERATOR || 'NexusCart',
  /** CPF ou CNPJ do responsável. Vazio = não aparece. */
  document: process.env.NEXT_PUBLIC_LEGAL_DOCUMENT || '',
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contato@nexuscart.com.br',
  /** Cidade/UF do foro dos Termos. */
  city: process.env.NEXT_PUBLIC_LEGAL_CITY || 'São Paulo/SP',
  updatedAt: '13 de novembro de 2026',
};
