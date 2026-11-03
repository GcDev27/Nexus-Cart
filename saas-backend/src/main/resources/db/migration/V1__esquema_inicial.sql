-- V1: esquema inicial do NexusCart, gerado a partir do banco que o Hibernate criou
-- (spring.jpa.hibernate.ddl-auto=update) antes da adoção do Flyway.
-- Bancos que já existiam são marcados com esta versão (baseline) e não rodam este arquivo.

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    sender character varying(255) NOT NULL,
    thread_id uuid NOT NULL,
    CONSTRAINT chat_messages_sender_check CHECK (((sender)::text = ANY ((ARRAY['CUSTOMER'::character varying, 'MERCHANT'::character varying, 'SYSTEM'::character varying])::text[])))
);

CREATE TABLE public.chat_threads (
    id uuid NOT NULL,
    closed boolean NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    customer_id uuid NOT NULL,
    last_message_at timestamp(6) without time zone NOT NULL,
    last_message_preview character varying(255),
    order_id uuid,
    subject character varying(255) NOT NULL,
    tenant_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    unread_for_customer integer NOT NULL,
    unread_for_merchant integer NOT NULL,
    CONSTRAINT chat_threads_type_check CHECK (((type)::text = ANY ((ARRAY['ORDER'::character varying, 'SUPPORT'::character varying])::text[])))
);

CREATE TABLE public.customers (
    id uuid NOT NULL,
    cpf character varying(255),
    created_at timestamp(6) without time zone NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    tenant_id uuid NOT NULL
);

CREATE TABLE public.orders (
    id uuid NOT NULL,
    amount numeric(38,2) NOT NULL,
    created_at timestamp(6) without time zone,
    customer_cpf character varying(255),
    customer_email character varying(255) NOT NULL,
    customer_name character varying(255) NOT NULL,
    delivered_content text,
    external_payment_id character varying(255),
    paid_at timestamp(6) without time zone,
    payment_provider character varying(255),
    product_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    qr_code text,
    qr_code_base64 text,
    status character varying(255) NOT NULL,
    tenant_id uuid NOT NULL,
    ticket_url text,
    variation_id uuid NOT NULL,
    variation_name character varying(255) NOT NULL,
    customer_id uuid,
    CONSTRAINT orders_payment_provider_check CHECK (((payment_provider)::text = ANY ((ARRAY['MERCADO_PAGO'::character varying, 'EFI_BANK'::character varying, 'ASAAS'::character varying, 'STRIPE'::character varying, 'PICPAY'::character varying, 'PAYPAL'::character varying, 'PUSHINPAY'::character varying])::text[]))),
    CONSTRAINT orders_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'CANCELLED'::character varying, 'REFUNDED'::character varying])::text[])))
);

CREATE TABLE public.payment_gateway_configs (
    id uuid NOT NULL,
    client_id character varying(255),
    client_secret text,
    created_at timestamp(6) without time zone,
    enabled boolean NOT NULL,
    fee_fixed numeric(38,2),
    fee_percentage numeric(38,2),
    is_pix_provider boolean NOT NULL,
    provider character varying(255) NOT NULL,
    public_key text,
    tenant_id uuid NOT NULL,
    updated_at timestamp(6) without time zone,
    webhook_secret text,
    CONSTRAINT payment_gateway_configs_provider_check CHECK (((provider)::text = ANY ((ARRAY['MERCADO_PAGO'::character varying, 'EFI_BANK'::character varying, 'ASAAS'::character varying, 'STRIPE'::character varying, 'PICPAY'::character varying, 'PAYPAL'::character varying, 'PUSHINPAY'::character varying])::text[])))
);

CREATE TABLE public.products (
    created_at timestamp(6) without time zone NOT NULL,
    category_id uuid,
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    chat_initial_message text,
    delivery_type character varying(255) NOT NULL,
    description text,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    visibility character varying(255) NOT NULL,
    category_name character varying(255),
    image_url text,
    CONSTRAINT products_delivery_type_check CHECK (((delivery_type)::text = ANY ((ARRAY['AUTOMATIC_LINES'::character varying, 'MANUAL_CHAT'::character varying])::text[])))
);

CREATE TABLE public.stock_lines (
    is_delivered boolean NOT NULL,
    created_at timestamp(6) without time zone,
    id uuid NOT NULL,
    variation_id uuid NOT NULL,
    content text NOT NULL,
    delivered_at timestamp(6) without time zone,
    order_id uuid,
    reserved_order_id uuid,
    reserved_until timestamp(6) without time zone
);

CREATE TABLE public.tenants (
    created_at timestamp(6) without time zone NOT NULL,
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    theme character varying(255) DEFAULT 'theme-glass'::character varying NOT NULL,
    primary_color character varying(255) DEFAULT '#8b5cf6'::character varying NOT NULL,
    font_family character varying(255) DEFAULT 'Inter'::character varying NOT NULL,
    hero_title text DEFAULT 'Premium Digital Assets.'::text,
    hero_description text DEFAULT 'Elevate seu projeto com produtos, scripts e licenças de alta qualidade desenvolvidos por especialistas.'::text,
    logo_url text,
    announcement_text character varying(255),
    banner_url text,
    corner_style character varying(255),
    discord_url character varying(255),
    footer_text text,
    instagram_url character varying(255),
    whatsapp_url character varying(255)
);

CREATE TABLE public.users (
    created_at timestamp(6) without time zone NOT NULL,
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password character varying(255) NOT NULL
);

CREATE TABLE public.variations (
    compare_at_price numeric(38,2),
    has_unlimited_stock boolean,
    price numeric(38,2),
    stock_quantity integer,
    created_at timestamp(6) without time zone,
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    chat_initial_message text,
    delivery_type character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    CONSTRAINT variations_delivery_type_check CHECK (((delivery_type)::text = ANY ((ARRAY['AUTOMATIC_LINES'::character varying, 'MANUAL_CHAT'::character varying])::text[])))
);

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT chat_threads_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT payment_gateway_configs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.stock_lines
    ADD CONSTRAINT stock_lines_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_key UNIQUE (slug);

ALTER TABLE ONLY public.payment_gateway_configs
    ADD CONSTRAINT uk92hjsvrfjerf611s7e9xonhyo UNIQUE (tenant_id, provider);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT uk_customer_tenant_email UNIQUE (tenant_id, email);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT uk_product_tenant_slug UNIQUE (tenant_id, slug);

ALTER TABLE ONLY public.chat_threads
    ADD CONSTRAINT ukkx8e4yxrpp382k85te4uv4vmj UNIQUE (order_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.variations
    ADD CONSTRAINT variations_pkey PRIMARY KEY (id);

CREATE INDEX idx_chat_message_thread ON public.chat_messages USING btree (thread_id, created_at);

CREATE INDEX idx_chat_thread_customer ON public.chat_threads USING btree (customer_id, last_message_at);

CREATE INDEX idx_chat_thread_tenant ON public.chat_threads USING btree (tenant_id, last_message_at);

ALTER TABLE ONLY public.stock_lines
    ADD CONSTRAINT fkghyej9xtobmovxh2528cltvke FOREIGN KEY (variation_id) REFERENCES public.variations(id);

ALTER TABLE ONLY public.variations
    ADD CONSTRAINT fkirgtm9oda4f0iqhpvy5ko2p9w FOREIGN KEY (product_id) REFERENCES public.products(id);
