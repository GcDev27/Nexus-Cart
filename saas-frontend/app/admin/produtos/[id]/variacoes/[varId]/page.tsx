import { redirect } from 'next/navigation';

// As opções de compra agora são editadas no painel lateral da tela do produto
export default async function VariacaoPage({ params }: { params: Promise<{ id: string; varId: string }> }) {
  const { id } = await params;
  redirect(`/admin/produtos/${id}/editar`);
}
