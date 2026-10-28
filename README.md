<div align="center">

# 🛒 CentralCart — SaaS E-commerce Platform

**Plataforma SaaS multi-tenant para venda de produtos digitais com entrega automática de chaves/seriais, checkout via PIX e painel administrativo completo.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-green?logo=spring-boot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://www.postgresql.org/)
[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)

</div>

---

## 📋 Sobre o Projeto

O **CentralCart** é uma plataforma SaaS de e-commerce focada em **produtos digitais** (chaves de jogos, gift cards, licenças de software, etc.), inspirada na [Central Cart](https://centralcart.shop).

Cada lojista cria sua **loja isolada (tenant)** com URL exclusiva, configura seus produtos, variações e estoque de chaves, e o sistema cuida de todo o fluxo — do checkout à entrega automática.

### Principais Funcionalidades

| Funcionalidade | Descrição |
|----------------|-----------|
| 🏪 **Multi-Tenancy** | Cada lojista opera uma loja completamente isolada com dados, produtos e clientes independentes |
| 🔑 **Entrega Automática** | Sistema de estoque de chaves/seriais com entrega instantânea após pagamento aprovado |
| 💳 **PIX via Mercado Pago** | Integração real com a API do Mercado Pago para geração de QR Code PIX |
| 📊 **Dashboard Admin** | Painel completo com KPIs, gráficos de receita, gestão de produtos, pedidos e clientes |
| 👤 **Área do Comprador** | Login, cadastro, histórico de compras e acesso às chaves compradas |
| ⚙️ **Configurações** | Personalização visual da loja (tema, cores, logo) e configuração de gateways de pagamento |
| 🔒 **Segurança JWT** | Autenticação dupla (lojistas e compradores) via JWT com Spring Security |

---

## 🏗️ Arquitetura

```
saas-ecommerce/
├── saas-frontend/          # Next.js 16 + Tailwind CSS 4 + TypeScript
│   ├── app/
│   │   ├── admin/          # Painel administrativo do lojista
│   │   │   ├── produtos/   # CRUD de produtos e variações
│   │   │   ├── pedidos/    # Gestão de pedidos
│   │   │   ├── clientes/   # Gestão de clientes
│   │   │   └── configuracoes/ # Tema, gateway de pagamento
│   │   ├── loja/[storeSlug]/ # Loja pública do tenant
│   │   │   ├── produto/    # Página de produto
│   │   │   ├── checkout/   # Checkout com PIX
│   │   │   ├── login/      # Login do comprador
│   │   │   └── minhas-compras/ # Portal do comprador
│   │   ├── login/          # Login do lojista
│   │   ├── registro/       # Registro de novo lojista
│   │   ├── lib/            # Utilitários (auth, customerAuth)
│   │   └── components/     # Componentes compartilhados
│   └── ...
├── saas-backend/           # Spring Boot 3.3 + Java 21
│   └── src/main/java/.../
│       ├── controller/     # REST Controllers (Admin, Storefront, Checkout)
│       ├── model/          # Entidades JPA (Product, Variation, Order, etc.)
│       ├── service/        # Lógica de negócio
│       ├── repository/     # Spring Data JPA Repositories
│       ├── security/       # JWT Filter, Security Config
│       ├── dto/            # Data Transfer Objects
│       └── exception/      # Exception handlers
├── docker-compose.yml      # PostgreSQL 16 containerizado
└── README.md               # Este arquivo
```

---

## 🚀 Setup Local

### Pré-requisitos

- **Node.js** 18+ e **npm** 9+
- **Java** 21 (JDK)
- **Docker** e **Docker Compose**
- **Git**

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/saas-ecommerce.git
cd saas-ecommerce
```

### 2. Subir o banco de dados

```bash
docker compose up -d
```

Isso inicia um PostgreSQL 16 na porta **5433** com o banco `saas_db`.

### 3. Configurar o Backend

```bash
cd saas-backend

# Copiar variáveis de ambiente (opcional - já tem defaults para dev)
cp .env.example .env

# Rodar o backend (porta 8081)
./gradlew bootRun
```

### 4. Configurar o Frontend

```bash
cd saas-frontend

# Instalar dependências
npm install

# Copiar variáveis de ambiente (opcional - já tem defaults para dev)
cp .env.example .env.local

# Rodar o frontend (porta 3000)
npm run dev
```

### 5. Acessar

| Serviço | URL |
|---------|-----|
| 🌐 Landing Page | [http://localhost:3000](http://localhost:3000) |
| 🔐 Login Lojista | [http://localhost:3000/login](http://localhost:3000/login) |
| 📊 Painel Admin | [http://localhost:3000/admin](http://localhost:3000/admin) |
| 🏪 Loja Pública | [http://localhost:3000/loja/{slug}](http://localhost:3000/loja/{slug}) |
| ⚙️ API Backend | [http://localhost:8081](http://localhost:8081) |

---

## 🔌 API Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registro de novo lojista + tenant |
| POST | `/api/auth/login` | Login do lojista |

### Admin (requer JWT de lojista)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/admin/products` | Listar/criar produtos |
| GET/PUT/DELETE | `/api/admin/products/{id}` | Detalhar/editar/excluir produto |
| GET/POST | `/api/admin/products/{id}/variations` | Variações do produto |
| GET | `/api/admin/orders` | Listar pedidos |
| GET | `/api/admin/customers` | Listar clientes |
| GET/PUT | `/api/admin/payment-gateways` | Configuração de gateways |

### Storefront (pública)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/storefront/{slug}/products` | Produtos da loja |
| GET | `/api/storefront/{slug}/products/{productSlug}` | Detalhes do produto |
| POST | `/api/storefront/customer/register` | Registro de comprador |
| POST | `/api/storefront/customer/login` | Login de comprador |

### Checkout (pública)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/checkout/orders` | Criar pedido + gerar PIX |
| GET | `/api/checkout/orders/{id}/status` | Consultar status do pedido |

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend** | Spring Boot 3.3, Java 21, Spring Security, Spring Data JPA |
| **Banco de Dados** | PostgreSQL 16 |
| **Autenticação** | JWT (JJWT 0.12) |
| **Pagamento** | Mercado Pago API (PIX) |
| **Editor Rich Text** | TipTap |
| **Animações** | Framer Motion |
| **Ícones** | Lucide React + Material Symbols |
| **Container** | Docker Compose |

---

## 📄 Variáveis de Ambiente

### Frontend (`saas-frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

### Backend (`saas-backend/application.properties`)
```env
DB_URL=jdbc:postgresql://localhost:5433/saas_db
DB_USERNAME=admin
DB_PASSWORD=adminpassword
JWT_SECRET=seu-secret-aqui
JWT_EXPIRATION=86400000
SERVER_PORT=8081
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📝 Licença

Este projeto é privado e de uso pessoal/comercial do desenvolvedor.
