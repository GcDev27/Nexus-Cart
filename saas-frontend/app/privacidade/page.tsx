import type { Metadata } from 'next';
import LegalPage, { Section } from '../components/LegalPage';
import { LEGAL } from '../lib/legal';

export const metadata: Metadata = {
  title: 'Política de privacidade | NexusCart',
  description: 'Quais dados o NexusCart coleta, para quê e como exercer seus direitos pela LGPD.',
};

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade">
      <Section title="1. Quem cuida dos seus dados">
        <p>
          Esta política explica como o NexusCart, operado por {LEGAL.operator}
          {LEGAL.document && <> ({LEGAL.document})</>}, trata dados pessoais, conforme a Lei Geral de Proteção de Dados
          (Lei 13.709/2018).
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Dados dos lojistas:</strong> o NexusCart é o controlador.</li>
          <li>
            <strong>Dados dos compradores de uma loja:</strong> o lojista é o controlador, e o NexusCart trata esses dados em
            nome dele (operador), só para fazer a loja funcionar.
          </li>
        </ul>
      </Section>

      <Section title="2. Quais dados coletamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Lojista:</strong> nome, e-mail, senha (guardada só como hash), dados da loja e, ao assinar um plano, o CPF ou CNPJ de quem paga.</li>
          <li><strong>Comprador:</strong> nome, e-mail, CPF (quando informado), pedidos, chaves entregues e mensagens trocadas no chat com a loja.</li>
          <li><strong>Técnicos:</strong> endereço IP e registros de acesso, usados contra fraude, invasão e excesso de requisições.</li>
        </ul>
        <p>
          Não pedimos nem guardamos dados de cartão. Pagamentos acontecem nas páginas do Mercado Pago (vendas das lojas) e do
          Asaas (mensalidade do NexusCart).
        </p>
      </Section>

      <Section title="3. Para que usamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Criar e manter sua conta e sua loja, processar pedidos e entregar as compras (execução de contrato).</li>
          <li>Cobrar a mensalidade dos lojistas e emitir a cobrança no Asaas (execução de contrato).</li>
          <li>Enviar e-mails da conta, como redefinição de senha (execução de contrato).</li>
          <li>Proteger a plataforma contra fraude e abuso, e guardar registros de acesso pelo prazo do Marco Civil da Internet (obrigação legal e legítimo interesse).</li>
        </ul>
        <p>Não vendemos dados pessoais e não usamos seus dados para publicidade.</p>
      </Section>

      <Section title="4. Com quem compartilhamos">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Lojista da loja onde você comprou:</strong> vê seu nome, e-mail, CPF (se informado), pedidos e mensagens.</li>
          <li><strong>Mercado Pago:</strong> recebe os dados necessários para gerar o Pix, pela conta do próprio lojista.</li>
          <li><strong>Asaas:</strong> recebe nome, e-mail e CPF/CNPJ do lojista para cobrar a mensalidade.</li>
          <li><strong>Provedores de hospedagem e de e-mail:</strong> guardam e transmitem os dados para o serviço funcionar.</li>
          <li><strong>Autoridades:</strong> quando houver ordem judicial ou obrigação legal.</li>
        </ul>
      </Section>

      <Section title="5. Por quanto tempo guardamos">
        <p>
          Enquanto a conta estiver ativa. Depois do encerramento, apagamos ou anonimizamos os dados, exceto o que a lei
          manda guardar (por exemplo, registros de acesso por 6 meses e dados de cobrança pelo prazo fiscal).
        </p>
      </Section>

      <Section title="6. Segurança">
        <p>
          Senhas são guardadas só como hash. Tokens de acesso aos gateways de pagamento são criptografados no banco. Uma
          loja não acessa dados de outra, e todo o tráfego usa HTTPS. Nenhum sistema é 100% seguro: se houver um incidente
          que traga risco a você, avisaremos e comunicaremos a ANPD conforme a lei.
        </p>
      </Section>

      <Section title="7. Cookies e armazenamento no navegador">
        <p>
          Usamos o armazenamento do navegador só para manter você conectado (o token da sessão). Não usamos cookies de
          publicidade nem rastreadores de terceiros.
        </p>
      </Section>

      <Section title="8. Seus direitos">
        <p>
          Você pode pedir a confirmação de que tratamos seus dados, acesso, correção, anonimização ou exclusão, portabilidade,
          informação sobre compartilhamentos e revogação de consentimento (art. 18 da LGPD). Para dados de compras numa loja,
          o pedido vai primeiro ao lojista; se ele não responder, ajudamos pelo e-mail abaixo. Respondemos em até 15 dias.
        </p>
      </Section>

      <Section title="9. Mudanças">
        <p>Se esta política mudar de forma relevante, avisaremos no painel ou por e-mail.</p>
      </Section>
    </LegalPage>
  );
}
