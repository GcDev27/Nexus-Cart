"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../../lib/auth";
import { daysUntil, fetchSubscription, PLANS, type PlanId, type Subscription } from "../../lib/subscription";
import { useToast } from "../../components/Toast";

const STATUS_LABEL: Record<Subscription["status"], string> = {
  TRIALING: "Teste grátis",
  ACTIVE: "Em dia",
  PAST_DUE: "Mensalidade vencida",
  CANCELED: "Cancelada",
};

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" }) : "-";
}

function maskDocument(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
}

export default function PlanoPage() {
  const { addToast } = useToast();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PlanId>("SUPER");
  const [document, setDocument] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    fetchSubscription().then(s => {
      setSub(s);
      if (s) setSelected(s.plan);
      setLoading(false);
    });
  }, []);

  const post = async (path: string, body?: object) => {
    setSaving(true);
    try {
      const res = await authFetch(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        addToast(data?.error || "Não foi possível concluir agora.", "error");
        return null;
      }
      setSub(data);
      return data as Subscription;
    } catch {
      addToast("Erro ao conectar ao servidor.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSubscribe = async () => {
    const result = await post("/api/admin/assinatura", { plan: selected, cpfCnpj: document });
    if (!result) return;
    if (result.invoiceUrl) {
      addToast("Cobrança criada. Abrindo a página de pagamento...", "success");
      window.open(result.invoiceUrl, "_blank", "noopener,noreferrer");
    } else {
      addToast(sub?.hasSubscription ? "Plano alterado." : "Assinatura criada.", "success");
    }
  };

  const handleCancel = async () => {
    setConfirmCancel(false);
    if (await post("/api/admin/assinatura/cancelar")) addToast("Assinatura cancelada. Nada mais será cobrado.", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!sub) {
    return <p className="py-space-lg text-outline">Não foi possível carregar o seu plano. Atualize a página.</p>;
  }

  const trialDays = daysUntil(sub.trialEndsAt);
  const changingPlan = sub.hasSubscription && selected !== sub.plan;
  const card = "rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)]";

  return (
    <div className="max-w-5xl">
      <div className="flex flex-col gap-1 py-space-lg mb-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Meu plano</h1>
        </div>
        <p className="font-body-sm text-body-sm text-outline">
          Mensalidade do NexusCart. As vendas da sua loja continuam caindo direto na sua conta do Mercado Pago.
        </p>
      </div>

      {/* Situação atual */}
      <div className={`${card} grid gap-space-md sm:grid-cols-3 mb-space-lg`}>
        <div>
          <span className="font-label-sm text-label-sm text-outline block mb-1">Plano</span>
          <p className="text-xl font-semibold text-on-surface">
            {sub.planLabel} <span className="text-sm font-normal text-outline">R$ {sub.monthlyPrice}/mês</span>
          </p>
        </div>
        <div>
          <span className="font-label-sm text-label-sm text-outline block mb-1">Situação</span>
          <p className={`text-xl font-semibold ${sub.storeOpen ? "text-secondary" : "text-red-400"}`}>
            {sub.storeOpen ? STATUS_LABEL[sub.status] : "Loja pausada"}
          </p>
        </div>
        <div>
          <span className="font-label-sm text-label-sm text-outline block mb-1">
            {sub.paidUntil ? "Pago até" : "Teste grátis até"}
          </span>
          <p className="text-xl font-semibold text-on-surface">
            {formatDate(sub.paidUntil ?? sub.trialEndsAt)}
            {!sub.paidUntil && sub.storeOpen && (
              <span className="text-sm font-normal text-outline"> ({trialDays} {trialDays === 1 ? "dia" : "dias"})</span>
            )}
          </p>
        </div>
      </div>

      {sub.invoiceUrl && (
        <a
          href={sub.invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-space-lg flex items-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-300 hover:bg-amber-400/15"
        >
          <span className="material-symbols-outlined text-xl">receipt_long</span>
          <span className="flex-1">Você tem uma mensalidade em aberto. Pague com Pix, boleto ou cartão.</span>
          <span className="underline underline-offset-2">Pagar agora</span>
        </a>
      )}

      {/* Planos */}
      <div className="grid gap-space-md md:grid-cols-3 mb-space-lg">
        {PLANS.map(plan => {
          const active = selected === plan.id;
          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelected(plan.id)}
              className={`text-left rounded-xl p-space-lg border transition-colors ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-on-surface">{plan.name}</span>
                {sub.plan === plan.id && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-outline">atual</span>
                )}
              </div>
              <p className="text-3xl font-semibold text-on-surface mb-3">
                R$ {plan.price}<span className="text-sm font-normal text-outline">/mês</span>
              </p>
              <ul className="space-y-1.5 text-sm text-on-surface-variant">
                {plan.perks.map(perk => (
                  <li key={perk} className="flex gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">check</span>
                    {perk}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Assinar / trocar */}
      <div className={card}>
        {!sub.billingAvailable ? (
          <p className="text-sm text-outline">
            A cobrança das mensalidades ainda está sendo ativada. Enquanto isso, sua loja segue no teste grátis.
          </p>
        ) : sub.hasSubscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-space-md justify-between">
            <p className="text-sm text-on-surface-variant">
              {changingPlan
                ? `Mudar para o ${PLANS.find(p => p.id === selected)?.name}. A diferença vale a partir da próxima cobrança em aberto.`
                : "Sua assinatura está ativa. A próxima cobrança chega por e-mail e aparece aqui."}
            </p>
            <div className="flex gap-2 shrink-0">
              {changingPlan && (
                <button
                  onClick={handleSubscribe}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm disabled:opacity-50"
                >
                  Mudar de plano
                </button>
              )}
              {confirmCancel ? (
                <>
                  <button onClick={handleCancel} disabled={saving} className="px-4 py-2.5 rounded-lg bg-red-500/15 text-red-300 border border-red-500/30 text-sm font-semibold">
                    Confirmar cancelamento
                  </button>
                  <button onClick={() => setConfirmCancel(false)} className="px-4 py-2.5 rounded-lg text-sm text-outline">
                    Voltar
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmCancel(true)} className="px-4 py-2.5 rounded-lg text-sm text-outline hover:text-on-surface">
                  Cancelar assinatura
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-space-md">
            <label className="flex-1">
              <span className="block text-sm font-medium text-on-surface mb-1.5">CPF ou CNPJ de quem paga</span>
              <input
                value={document}
                onChange={e => setDocument(maskDocument(e.target.value))}
                inputMode="numeric"
                placeholder="000.000.000-00"
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-2.5 text-sm text-on-surface outline-none"
              />
              <span className="block text-xs text-outline mt-1.5">
                Exigido pelo Asaas para emitir a cobrança.
                {sub.status === "TRIALING" && sub.storeOpen && " A primeira mensalidade só vence no fim do teste grátis."}
              </span>
            </label>
            <button
              onClick={handleSubscribe}
              disabled={saving || document.replace(/\D/g, "").length < 11}
              className="px-5 py-2.5 rounded-lg bg-primary text-on-primary font-semibold text-sm disabled:opacity-50 shrink-0"
            >
              {saving ? "Gerando cobrança..." : `Assinar o ${PLANS.find(p => p.id === selected)?.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
