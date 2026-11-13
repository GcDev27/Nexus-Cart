import type { Metadata } from 'next';
import LegalPage, { Section } from '../components/LegalPage';
import { LEGAL } from '../lib/legal';

export const metadata: Metadata = {
  title: 'Termos de uso | NexusCart',
  description: 'Regras de uso do NexusCart para lojistas e compradores.',
};

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso">
      <Section title="1. Quem somos">
        <p>
          O NexusCart é uma plataforma para criar lojas virtuais de produtos digitais, operada por {LEGAL.operator}
          {LEGAL.document && <>, inscrito(a) sob o documento {LEGAL.document}</>}. Ao criar uma conta ou comprar numa
          loja hospedada aqui, você concorda com estes termos.
        </p>
      </Section>

      <Section title="2. O que o NexusCart faz e o que não faz">
        <p>
          Oferecemos a vitrine, o checkout com Pix, a entrega automática das chaves cadastradas pelo lojista, o chat entre
          comprador e lojista e o painel de gestão.
        </p>
        <p>
          O NexusCart <strong>não vende</strong> os produtos das lojas. Cada lojista é o vendedor, responsável pelo que
          anuncia, pelo preço, pela entrega, pelo suporte ao comprador, por trocas e reembolsos e pelas obrigações fiscais
          da venda. O pagamento do comprador vai direto para a conta do Mercado Pago do lojista; o NexusCart não recebe nem
          guarda esse dinheiro.
        </p>
      </Section>

      <Section title="3. Conta do lojista">
        <p>
          Você deve informar dados verdadeiros, manter a senha em sigilo e é responsável pelo que acontece na sua conta.
          É preciso ter 18 anos ou mais para abrir uma loja.
        </p>
      </Section>

      <Section title="4. O que é proibido vender ou fazer">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Produtos ilegais, pirateados, roubados, falsificados ou obtidos por fraude (incluindo chaves e contas de origem ilícita).</li>
          <li>Conteúdo que viole direitos autorais, marcas ou a privacidade de terceiros.</li>
          <li>Golpes, promessas enganosas ou cobrança por produto que não será entregue.</li>
          <li>Tentar invadir, sobrecarregar ou burlar a segurança da plataforma ou de outras lojas.</li>
        </ul>
        <p>
          Podemos remover produtos e suspender ou encerrar lojas que descumpram estas regras, com ou sem aviso prévio
          conforme a gravidade, e colaborar com autoridades quando a lei exigir.
        </p>
      </Section>

      <Section title="5. Planos, teste grátis e pagamento">
        <p>
          Toda loja começa com 7 dias de teste grátis, sem cartão. Depois disso, o uso depende de um plano mensal (Starter,
          Super ou Rich), com os preços e recursos mostrados na página de preços e em &quot;Meu plano&quot;.
        </p>
        <p>
          A mensalidade é cobrada pelo Asaas, por Pix, boleto ou cartão. Se o teste terminar sem assinatura, ou a mensalidade
          ficar mais de 3 dias em atraso, a vitrine e o checkout da loja são pausados até o pagamento. Seus produtos e
          pedidos continuam guardados, e os compradores continuam vendo as compras já feitas.
        </p>
        <p>
          Você pode trocar de plano ou cancelar a qualquer momento em &quot;Meu plano&quot;. O cancelamento interrompe as
          próximas cobranças, e a loja fica no ar até o fim do período já pago. Não devolvemos valores de meses já iniciados,
          exceto quando a lei exigir.
        </p>
      </Section>

      <Section title="6. Para quem compra">
        <p>
          A compra é feita com o lojista. Problemas com o produto, entrega ou reembolso devem ser resolvidos com ele, pelo
          chat do pedido ou pelos contatos da loja. Seus direitos como consumidor, incluindo os do Código de Defesa do
          Consumidor, valem contra o lojista. Se o lojista não responder, fale com a gente pelo e-mail abaixo.
        </p>
      </Section>

      <Section title="7. Disponibilidade e responsabilidade">
        <p>
          Trabalhamos para manter a plataforma no ar e segura, mas ela pode ter interrupções para manutenção ou por falhas
          de terceiros (hospedagem, Mercado Pago, Asaas, provedores de e-mail). Não respondemos por lucros cessantes nem por
          prejuízos causados por produtos, informações ou condutas dos lojistas, nos limites permitidos pela lei.
        </p>
      </Section>

      <Section title="8. Mudanças nestes termos">
        <p>
          Podemos atualizar estes termos. Mudanças relevantes serão avisadas no painel ou por e-mail com antecedência
          razoável. Continuar usando a plataforma depois disso significa concordar com a nova versão.
        </p>
      </Section>

      <Section title="9. Lei e foro">
        <p>
          Estes termos seguem a lei brasileira. Fica eleito o foro de {LEGAL.city}, ressalvado o direito do consumidor de
          entrar com ação no foro do seu domicílio.
        </p>
      </Section>
    </LegalPage>
  );
}
