import type { Metadata } from 'next';
import AuthCard from '../components/AuthCard';
import PasswordResetForm from '../components/PasswordResetForm';

export const metadata: Metadata = { title: 'Esqueci minha senha | NexusCart' };

export default function EsqueciSenhaPage() {
  return (
    <AuthCard title="Esqueceu a senha?" subtitle="Informe o e-mail do painel. Vamos mandar um link para criar uma nova senha.">
      <PasswordResetForm mode="request" variant="platform" loginHref="/login" />
    </AuthCard>
  );
}
