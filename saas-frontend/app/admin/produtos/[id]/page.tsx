import { redirect } from 'next/navigation';

// O produto e as suas opções de compra são editados numa tela só
export default async function ProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/produtos/${id}/editar`);
}
