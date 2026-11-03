-- V2: pedidos com Pix vencido passam a ficar com status EXPIRED (a chave reservada volta ao estoque).
-- O Hibernate cria a restrição CHECK com os valores do enum e nunca a atualiza; por isso a troca é manual.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'REFUNDED'));

-- Bancos antigos podem ter a restrição de slug único em todas as lojas; o certo é único por loja
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_slug_key;

-- Busca dos pedidos pendentes vencidos (rotina de expiração) e do limite de Pix em aberto por e-mail
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_email ON public.orders (tenant_id, lower(customer_email));
