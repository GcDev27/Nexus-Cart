-- Planos, teste grátis e assinatura (cobrada pelo Asaas)
ALTER TABLE tenants ADD COLUMN plan varchar(20);
ALTER TABLE tenants ADD COLUMN subscription_status varchar(20);
ALTER TABLE tenants ADD COLUMN trial_ends_at timestamp(6) without time zone;
ALTER TABLE tenants ADD COLUMN paid_until timestamp(6) without time zone;
ALTER TABLE tenants ADD COLUMN asaas_customer_id varchar(64);
ALTER TABLE tenants ADD COLUMN asaas_subscription_id varchar(64);

-- Lojas que já existiam ganham 7 dias de teste a partir de agora
UPDATE tenants SET plan = 'SUPER', subscription_status = 'TRIALING', trial_ends_at = now() + interval '7 days';

ALTER TABLE tenants ALTER COLUMN plan SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN subscription_status SET NOT NULL;
ALTER TABLE tenants ADD CONSTRAINT tenants_plan_check CHECK (plan IN ('STARTER', 'SUPER', 'RICH'));
ALTER TABLE tenants ADD CONSTRAINT tenants_subscription_status_check
    CHECK (subscription_status IN ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'));
CREATE UNIQUE INDEX idx_tenants_asaas_subscription ON tenants (asaas_subscription_id);

-- Aceite dos termos (LGPD) e troca de senha, que derruba sessões antigas
ALTER TABLE users ADD COLUMN terms_accepted_at timestamp(6) without time zone;
ALTER TABLE users ADD COLUMN password_changed_at timestamp(6) without time zone;
ALTER TABLE customers ADD COLUMN password_changed_at timestamp(6) without time zone;

-- Links de "esqueci minha senha": guardamos só o hash do token
CREATE TABLE password_reset_tokens (
    id uuid NOT NULL PRIMARY KEY,
    token_hash varchar(64) NOT NULL UNIQUE,
    account_type varchar(20) NOT NULL CHECK (account_type IN ('MERCHANT', 'CUSTOMER')),
    account_id uuid NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    used_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL
);
CREATE INDEX idx_password_reset_account ON password_reset_tokens (account_type, account_id);
