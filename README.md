# Sistema de Pedidos — Desafio Técnico Full Stack

Sistema de alta performance para **Gestão de Pedidos**, **Analytics de Faturamento** e **Notificação Assíncrona**, desenvolvido em **.NET 6**, **React**, **Node.js** e **PostgreSQL**.

---

## Versões Utilizadas no Projeto

- **Backend .NET:** .NET 6.0 (C# / ASP.NET Core Web API)
- **Frontend React:** React 18.2 (Vite 5 / JavaScript ES6)
- **Microserviço Node:** Node.js 18.x / Express 4.18
- **Banco de Dados:** PostgreSQL 15 (Alpine)
- **Orquestração:** Docker Compose v3.8

---

## Como Rodar o Projeto

Você pode executar o projeto de duas formas: **via Docker** (recomendado, 1 comando) ou **localmente sem Docker**.

### Opção 1: Via Docker Compose (Recomendado)

#### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

#### Passo a Passo
1. No terminal, acesse a pasta raiz do projeto:
   ```bash
   cd desafio-pedidos
   ```

2. Execute o comando para construir e subir todos os containers:
   ```bash
   docker compose up --build
   ```

3. Acesse no seu navegador:
   - 🖥️ **Interface Web (React):** [http://localhost:3000](http://localhost:3000)
   - 📑 **Swagger API (.NET):** [http://localhost:5000/swagger](http://localhost:5000/swagger)
   - 📩 **Microserviço (Node.js):** [http://localhost:4000](http://localhost:4000)

> 💡 **Nota:** Na primeira execução, o banco PostgreSQL aplicará as migrations e o `DbInitializer` populará automaticamente **5.000 pedidos com múltiplos itens** (utilizando a biblioteca *Bogus*) para testes realistas de performance.

---

### Opção 2: Rodar Localmente (Sem Docker)

#### Pré-requisitos
- .NET 6 SDK
- Node.js (v18+)
- PostgreSQL rodando localmente na porta `5432` (Usuário: `postgres`, Senha: `postgres`, Banco: `pedidosdb`)

#### 1. Backend (.NET)
```bash
cd PedidosAPI
dotnet restore
dotnet run
```
*A API subirá em `http://localhost:5000` (ou porta configurada no launchSettings.json).*

#### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*O Web React subirá em `http://localhost:5173` ou `http://localhost:3000`.*

#### 3. Microserviço (Node.js)
```bash
cd microservice
npm install
npm start
```
*O microserviço subirá na porta `http://localhost:4000`.*

---

## Decisões Técnicas e Arquitetura

### 1. Separação de ORM: EF Core vs. Dapper
- **EF Core (Escrita):** Utilizado no endpoint `POST /api/orders` para salvar pedidos e itens. O EF Core gerencia o agregado da entidade e garante a integridade transacional.
- **EF Core com `.AsNoTracking()` (Listagem Paginada):** Utilizado no endpoint `GET /api/orders`. Desativa o rastreamento do EF Core para consultas somente-leitura, reduzindo o consumo de memória e otimizando a resposta.
- **Dapper (Leitura Analítica):** Utilizado no endpoint `GET /api/orders/revenue` (Faturamento por período). Por se tratar de uma agregação pesada (`SUM` e `GROUP BY`), a consulta é executada via SQL nativo direto no Dapper para entregar performance máxima sub-segundo.

### 2. Otimização no Banco de Dados
- Foi criado um **Índice na coluna `OrderDate`** no PostgreSQL via EF Core (`OnModelCreating`). Isso garante que buscas filtradas por intervalo de datas sejam executadas de forma instantânea mesmo em tabelas com milhares de linhas.

---

## Estratégia para Alta Volumetria e Expurgo de Dados (Escala Real)

Em cenários reais de produção com acúmulo de milhões de registros ao longo dos anos, a tabela relacional operacional (`Orders`) tende a sofrer degradação de performance. A arquitetura proposta para escala envolve:

1. **Particionamento por Faixa de Data (Range Partitioning):** Particionar a tabela `Orders` no PostgreSQL por mês/ano (`OrderDate`). As consultas operacionais leem apenas as partições recentes.
2. **Política de Expurgo / Arquivamento (Cold Storage):** Uma rotina assíncrona agendada (Worker Service / Job) migra pedidos antigos (ex: com mais de 2 anos) da tabela ativa `Orders` para uma tabela histórica `Orders_Archive` ou Data Lake.
3. **CQRS / Réplicas de Leitura:** Leitura de relatórios de faturamento direcionada para uma réplica somente-leitura (Read Replica) para zerar qualquer possibilidade de *lock* na tabela de vendas.

---

## Microserviço em Node.js (Notificações Assíncronas)

A aplicação conta com um **Microserviço em Node.js (Express)** totalmente integrado no Docker Compose:

```text
[ React Frontend ] ──> [ API .NET 6 ] ──(Disparo Assíncrono)──> [ Microserviço Node.js ] ──> [ Log / Notificação ]
```

1. **Processamento em Segundo Plano:** Ao criar um novo pedido na API .NET, um disparo HTTP assíncrono em segundo plano (*fire-and-forget*) é feito para o container do Node.js (`http://microservice:4000/api/notifications`).
2. **Resiliência:** O microserviço emite a confirmação/notificação do pedido em tempo real nos logs do container sem travar ou aumentar a latência da resposta do usuário no frontend.

---

## Estrutura do Repositório

- `/PedidosAPI`: Backend Web API em .NET 6 (Controllers, EF Core, Dapper).
- `/frontend`: Frontend Web em React (Vite, Axios, Lucide Icons).
- `/microservice`: Microserviço em Node.js (Express) para Notificações.
- `docker-compose.yml`: Orquestrador dos 4 containers (Postgres, API .NET, Web React, Node.js).
- `AGENTS.md`: Guia de padronização, convenções e regras de contexto para Inteligência Artificial.
- `AI_NOTES.md`: Relatório sobre o fluxo de trabalho com Inteligência Artificial.
