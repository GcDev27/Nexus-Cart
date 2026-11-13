import type { Metadata } from 'next';
import AuthCard from '../components/AuthCard';
import PasswordResetForm from '../components/PasswordResetForm';

export const metadata: Metadata = { title: 'Nova senha | NexusCart', robots: { index: false } };

export default function RedefinirSenhaPage() {
  return (
    <AuthCard title="Criar nova senha" subtitle="Depois de salvar, as sessões abertas em outros aparelhos são encerradas.">
      <PasswordResetForm mode="reset" variant="platform" loginHref="/login" />
    </AuthCard>
  );
}
