# 🤖 AI Notes — Relatório de Uso da Inteligência Artificial

Este documento descreve como as ferramentas de IA assistida (Google IA Studio) foram utilizadas durante o desenvolvimento deste desafio técnico.

---

## 1. Onde a IA Ajudou (Ganhos de Produtividade)
- **Geração do Seed de Dados:** A IA auxiliou no setup da biblioteca `Bogus` no `DbInitializer.cs` para popular 5.000 pedidos e itens fictícios realistas com cálculo automático de totalizadores.
- **Boilerplate e Estilização do React:** Aceleração na criação da interface em React com tabelas de listagem, paginação, componentes expansíveis (Accordion) e formulários dinâmicos.
- **Construção da Infraestrutura Docker:** Geração das etapas de build (*multi-stage builds*) para o backend .NET, frontend React com Nginx e orquestração via `docker-compose.yml` com *healthchecks* do PostgreSQL.

---

## 2. Onde a IA Errou e Foi Necessário Intervir (Ajustes Técnicos de Senioridade)
- **Compatibilidade de Pacotes do .NET 6:** A IA sugeriu instalar as versões mais recentes dos pacotes do Entity Framework Core (versão 10.0), que romperam com a versão target .NET 6. Corrigi manualmente especificando as versões LTS compatíveis (`6.0.22`).
- **Otimização do SQL no Dapper:** A IA sugeriu fazer a agregação do faturamento trazendo os dados para a memória da aplicação C# (.NET). Corrigi o código instruindo a realização do `GROUP BY` e `SUM` diretamente na consulta SQL nativa no banco de dados.
- **Mapeamento de Fusohorário no PostgreSQL:** Na inserção em lote, o driver `Npgsql` rejeitou os objetos `DateTime` gerados pelo Bogus devido ao `DateTimeKind.Local`. Ativei a flag `Npgsql.EnableLegacyTimestampBehavior` no `Program.cs` e converti explicitamente os campos para UTC (`.ToUniversalTime()`).
- **Referência Circular no JSON:** Durante a serialização das entidades agregadas (`Order` -> `OrderItem` -> `Order`), o .NET estourou exceção de ciclo de objeto. Corrigi aplicando `ReferenceHandler.IgnoreCycles` nos `JsonSerializerOptions` das Controllers.

---

## 3. O que foi Decidido e Feito À Mão
- **Escolha da Arquitetura C#:** Decisão de utilizar Controllers tradicionais em vez de Minimal APIs para maior clareza nas rotas e manutenibilidade.
- **Indexação de Performance:** Criação manual do Índice no campo `OrderDate` via EF Core (`OnModelCreating`) para garantir consultas sub-segundo no faturamento diário.
- **Separação Estratégica das Ferramentas de Banco:** 
  - **EF Core:** Usado na escrita (`POST /api/orders`) para manter a integridade do agregado e na listagem paginada com `.AsNoTracking()`.
  - **Dapper:** Usado no relatório de faturamento (`GET /api/orders/revenue`) por conta da velocidade superior em consultas analíticas agregadas.