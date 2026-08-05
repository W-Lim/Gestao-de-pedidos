# Sistema de Pedidos — Desafio Técnico Full Stack

Sistema simples e de alta performance para **Gestão de Pedidos** e **Analytics de Faturamento**, desenvolvido em **.NET 6**, **React** e **PostgreSQL**.

---

## Como Rodar o Projeto (Passo a Passo)

A aplicação está totalmente containerizada usando **Docker Compose**. Com apenas **um comando**, o Banco de Dados, o Backend e o Frontend são construídos e executados juntos.

### Pré-requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

### Passo a Passo
1. No terminal, entre na pasta raiz do projeto:
   ```bash
   cd desafio-pedidos
   ```

2. Execute o comando para subir todo o ambiente:
   ```bash
   docker compose up --build
   ```

3. Acesse os links no navegador:
   - **Interface Web (React):** [http://localhost:3000](http://localhost:3000)
   - **Documentação da API (Swagger):** [http://localhost:5000/swagger](http://localhost:5000/swagger)

> **Nota:** Ao subir a aplicação pela primeira vez, o banco PostgreSQL aplicará as migrations e o `DbInitializer` populará automaticamente **5.000 pedidos com múltiplos itens** (utilizando a biblioteca *Bogus*) para testes realistas de performance.

---

## Decisões Técnicas e Arquitetura

### 1. Escolha de ORM: EF Core vs Dapper
* **EF Core (Escrita):** Utilizado no endpoint `POST /api/orders` para salvar pedidos e itens. O EF Core gerencia o agregado da entidade e garante a integridade transacional.
* **EF Core com `.AsNoTracking()` (Listagem Paginada):** Utilizado no endpoint `GET /api/orders`. Desativa o rastreamento do EF Core para consultas somente-leitura, reduzindo o consumo de memória e otimizando a resposta.
* **Dapper (Leitura Analítica):** Utilizado no endpoint `GET /api/orders/revenue` (Faturamento por período). Por se tratar de uma agregação pesada (`SUM` e `GROUP BY`), a consulta é executada via SQL nativo direto no Dapper para entregar performance máxima sub-segundo.

### 2. Otimização no Banco de Dados
* Foi criado um **Índice na coluna `OrderDate`** no PostgreSQL via EF Core (`OnModelCreating`). Isso garante que buscas filtradas por intervalo de datas sejam executadas de forma instantânea mesmo em tabelas com milhares de linhas.

---

## Arquitetura do Microserviço em Node.js (Desenho)

Como proposto no desafio, o microserviço separado em **Node.js** para processamento assíncrono seria desenhado assim:

```text
[ Frontend React ] ──> [ API .NET 6 ] ──(Publica Evento)──> [ RabbitMQ / Fila ] ──> [ Worker Node.js ] ──> [ Notificação / Email ]
```

1. **Comunicação Assíncrona:** Ao criar um pedido na API .NET, um evento `OrderCreated` é publicado de forma assíncrona em uma fila no **RabbitMQ**.
2. **Processamento:** O serviço em Node.js escuta a fila em segundo plano e realiza tarefas secundárias (envio de e-mails ou notificações) sem travar o tempo de resposta da API principal para o usuário final.

---

## Estrutura do Repositório
* `/PedidosAPI`: Backend Web API em .NET 6 (Controllers, EF Core, Dapper).
* `/frontend`: Frontend Web em React (Vite, Axios, Lucide Icons).
* `docker-compose.yml`: Orquestrador dos containers (Postgres, API .NET, Web React).
* `AI_NOTES.md`: Relatório sobre o fluxo de trabalho com Inteligência Artificial.