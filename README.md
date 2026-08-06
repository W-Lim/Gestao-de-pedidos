# Sistema de Pedidos — Desafio Técnico Full Stack

Sistema de alta performance para **Gestão de Pedidos**, **Analytics de Faturamento** e **Notificação Assíncrona**, desenvolvido em **.NET 6**, **React**, **Node.js** e **PostgreSQL**.

---

## Como Rodar a Aplicação (Passo a Passo)

A aplicação está totalmente containerizada usando **Docker Compose**. Com apenas **um comando**, o Banco de Dados, o Backend, o Frontend e o Microserviço são construídos e executados juntos.

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

### Passo a Passo
1. Clone o repositório e acesse a pasta raiz:
   ```bash
   cd Gestao-de-pedidos
   ```

2. Execute o comando para subir todo o ecossistema:
   ```bash
   docker compose up --build
   ```

3. Acesse no seu navegador:
   - 🖥️ **Interface Web (React):** [http://localhost:3000](http://localhost:3000)
   - 📑 **Documentação da API (Swagger):** [http://localhost:5000/swagger](http://localhost:5000/swagger)
   - 📩 **Microserviço Node.js (Notificações):** [http://localhost:4000](http://localhost:4000)

> 💡 **Nota:** Na primeira execução, o banco PostgreSQL aplicará as migrations e o `DbInitializer` populará automaticamente **5.000 pedidos com múltiplos itens** (utilizando a biblioteca *Bogus*) para testes realistas de performance.

---

## Decisões Técnicas e Arquitetura

### 1. Separação de ORM: EF Core vs. Dapper
- **EF Core (Escrita):** Utilizado no endpoint `POST /api/orders` para salvar pedidos e itens. O EF Core gerencia o agregado da entidade e garante a integridade transacional.
- **EF Core com `.AsNoTracking()` (Listagem Paginada):** Utilizado no endpoint `GET /api/orders`. Desativa o rastreamento do EF Core para consultas somente-leitura, reduzindo o consumo de memória e otimizando a resposta.
- **Dapper (Leitura Analítica):** Utilizado no endpoint `GET /api/orders/revenue` (Faturamento por período). Por se tratar de uma agregação pesada (`SUM` e `GROUP BY`), a consulta é executada via SQL nativo direto no Dapper para entregar performance máxima sub-segundo.

### 2. Otimização no Banco de Dados
- Foi criado um **Índice na coluna `OrderDate`** no PostgreSQL via EF Core (`OnModelCreating`). Isso garante que buscas filtradas por intervalo de datas sejam executadas de forma instantânea mesmo em tabelas com milhares de linhas.

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
- `AI_NOTES.md`: Relatório sobre o fluxo de trabalho com Inteligência Artificial.
  
---

##  O que faria com mais tempo (Melhorias Futuras)

1. **Testes Automatizados:** Adicionaria testes unitários e de integração com xUnit e Moq no .NET, e Vitest/Testing Library no React.
2. **Mensageria Real (RabbitMQ):** Substituiria o disparo HTTP síncrono para o microserviço Node.js por uma fila assíncrona com RabbitMQ ou Redis Pub/Sub.
3. **Autenticação e Autorização:** Implementaria JWT (JSON Web Tokens) para proteger as rotas da API.
