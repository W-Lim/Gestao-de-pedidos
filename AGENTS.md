# AGENTS.md

Este documento define as convenções, padrões e boas práticas observadas no repositório do projeto. Ele serve como referência para agentes, automações e contribuições futuras, garantindo consistência no código, na estrutura de arquivos e no comportamento esperado do sistema.

## 1. Visão geral do projeto

O repositório é composto por três partes principais:

- Backend em .NET 6, localizado em [PedidosAPI](PedidosAPI)
- Frontend em React + Vite, localizado em [frontend](frontend)
- Microserviço em Node.js/Express, localizado em [microservice](microservice)

A arquitetura do projeto segue uma abordagem simples e modular:

- O backend expõe endpoints REST para gestão de pedidos.
- O frontend consome esses endpoints e exibe uma interface de listagem, paginação e analytics.
- O microserviço recebe notificações assíncronas quando um pedido é criado.

## 2. Convenções de linguagem e estilo

### 2.1. C# / .NET

- O código backend usa C# com .NET 6.
- A estrutura é organizada por pastas temáticas: Controllers, Data, DTOs, Models, Migrations.
- Os nomes de classes usam PascalCase.
- Métodos e propriedades usam PascalCase.
- Variáveis locais usam camelCase.
- Campos privados usam prefixo underscore e camelCase, por exemplo: `_context`, `_connectionString`.
- O código favorece clareza e legibilidade sobre excesso de abstração.
- Comentários são usados para explicar trechos importantes, especialmente lógicas de negócio, integrações e otimizações.

Exemplo de estilo esperado:

```csharp
public async Task<ActionResult<Order>> CreateOrder([FromBody] CreateOrderDto dto)
{
    if (dto == null || dto.Items == null || !dto.Items.Any())
    {
        return BadRequest("O pedido deve conter pelo menos um item.");
    }

    var order = new Order
    {
        CustomerName = dto.CustomerName,
        OrderDate = DateTime.UtcNow,
        Items = dto.Items.Select(i => new OrderItem
        {
            ProductName = i.ProductName,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice
        }).ToList()
    };

    order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);

    _context.Orders.Add(order);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetOrders), new { id = order.Id }, order);
}
```

### 2.2. JavaScript / React

- O frontend usa React com JSX e componentes funcionais.
- Os componentes são definidos como funções exportadas por padrão.
- O código evita complexidade desnecessária e prefere uma estrutura linear e explícita.
- Variáveis de estado usam `useState` com nomes descritivos em camelCase.
- Funções auxiliares seguem o padrão camelCase e devem ter responsabilidade única.
- Nomes de funções de eventos costumam começar com `handle`, como `handleCreateOrder`, `handleAddItem` e `handleItemChange`.
- Funções de busca de dados costumam começar com `fetch`, como `fetchOrders` e `fetchRevenue`.
- O código usa `useEffect` para reagir a mudanças de estado e carregar dados quando necessário.

Exemplo de estilo esperado:

```jsx
const fetchOrders = async (currentPage) => {
  setLoadingOrders(true);
  try {
    const response = await axios.get(`${API_URL}?page=${currentPage}&pageSize=8`);
    setOrders(response.data.items);
    setTotalPages(response.data.totalPages);
    setTotalItems(response.data.totalItems);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
  } finally {
    setLoadingOrders(false);
  }
};
```

### 2.3. Node.js / Express

- O microserviço é simples, direto e focado em um único objetivo: receber notificações e responder com sucesso.
- O código usa `const` para constantes e `require` para imports comuns.
- O estilo é minimalista, com pouca abstração e sem overengineering.
- Logs são escritos com `console.log` para acompanhar o fluxo de processamento.

## 3. Padrões de arquitetura

### 3.1. Backend

- O backend usa ASP.NET Core com controllers e injeção de dependência.
- O controller principal é [PedidosAPI/Controllers/OrdersController.cs](PedidosAPI/Controllers/OrdersController.cs).
- O acesso ao banco é feito via `AppDbContext` e, quando necessário, via Dapper para consultas analíticas.
- O projeto usa `DbContext` para manipulação de dados transacionais e `NpgsqlConnection` para consultas SQL nativas em cenários específicos.

### 3.2. Frontend

- O frontend é uma única tela principal, com navegação por abas e componentes visuais baseados em cards, tabelas e modais.
- A lógica principal fica no arquivo [frontend/src/App.jsx](frontend/src/App.jsx).
- O estilo visual está em [frontend/src/App.css](frontend/src/App.css).
- As telas seguem um visual limpo, com design baseado em cards, botões, tabelas e espaçamentos consistentes.

### 3.3. Microserviço

- O microserviço é leve e não mantém estado.
- Ele expõe um endpoint POST em `/api/notifications` para receber eventos.
- O processamento é síncrono para o cliente, mas o fluxo é simples e resiliente para fins de demonstração.

## 4. Convenções de acesso ao banco de dados

### 4.1. Entity Framework Core

- O acesso principal ao banco é feito por meio do `AppDbContext`.
- As entidades principais são `Order` e `OrderItem`.
- O `DbContext` é configurado no arquivo [PedidosAPI/Data/AppDbContext.cs](PedidosAPI/Data/AppDbContext.cs).
- O projeto usa migrations para controle de esquema.
- O carregamento de listas de pedidos usa `.AsNoTracking()` em consultas somente leitura para melhorar performance.

### 4.2. Dapper

- Dapper é usado para consultas analíticas mais pesadas, como faturamento por período.
- A consulta é feita com SQL nativo e mapeamento direto para DTOs.
- O uso de Dapper deve ser preservado para cenários de agregação e leitura volumosa.

### 4.3. Inicialização do banco

- O banco é populado automaticamente ao iniciar a aplicação via `DbInitializer`.
- A lógica de seed usa Bogus para gerar dados realistas.
- O processo de inicialização é feito na criação do host do backend, conforme o fluxo em [PedidosAPI/Program.cs](PedidosAPI/Program.cs).

## 5. Convenções de modelos e DTOs

- Modelos de domínio ficam em [PedidosAPI/Models](PedidosAPI/Models).
- DTOs ficam em [PedidosAPI/DTOs](PedidosAPI/DTOs).
- Propriedades de entidades devem ser explícitas e com tipos claros.
- Campos como `CustomerName`, `OrderDate`, `TotalAmount` e `Items` devem seguir nomes em PascalCase.
- Para propriedades opcionais ou nulas, usar `?` quando apropriado.

Exemplo de modelo:

```csharp
public class Order
{
    public int Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }

    public List<OrderItem> Items { get; set; } = new List<OrderItem>();
}
```

## 6. Padrões de telas e interface

### 6.1. Estrutura visual

- O frontend utiliza uma tela principal com:
  - navbar no topo;
  - abas para alternar entre pedidos e faturamento;
  - cards de KPI;
  - tabelas com linhas clicáveis e acordeões;
  - modal para criação de pedidos.

### 6.2. Estilo visual

- O projeto usa uma estética limpa com azul como cor principal.
- Há forte uso de bordas, caixas brancas, sombras leves e espaçamentos consistentes.
- Botões e componentes seguem um padrão visual uniforme.
- A interface é majoritariamente em português brasileiro.

### 6.3. Comportamento esperado

- A tela de pedidos exibe pedidos paginados.
- Ao clicar em uma linha, os itens do pedido podem ser expandidos.
- A criação de pedidos é feita via modal.
- A aba de faturamento exibe dados consolidados por período.

## 7. Regras para agentes

Ao implementar alterações ou criar novos componentes, agentes devem seguir estas regras:

1. Respeitar a estrutura existente dos projetos.
2. Manter nomes em português quando o contexto for de domínio do negócio.
3. Preservar o padrão de organização por pastas.
4. Evitar mudar a arquitetura do sistema sem necessidade.
5. Preferir soluções simples e legíveis.
6. Manter consistência com o estilo visual do frontend.
7. Não introduzir abstrações desnecessárias.
8. Preferir `async/await` em operações assíncronas.
9. Não remover comentários quando eles explicam decisões técnicas importantes.
10. Ao alterar o backend, manter compatibilidade com os endpoints existentes.
11. Ao alterar o frontend, preservar a experiência visual atual.

## 8. Diretrizes de implementação

### 8.1. Backend

- Manter controllers enxutos e com lógica clara.
- Usar injeção de dependência e `DbContext` conforme já implementado.
- Para operações de leitura simples, preferir EF Core com `AsNoTracking()`.
- Para consultas agregadas e pesadas, usar Dapper.
- Não fazer alterações que comprometam a performance sem justificativa.

### 8.2. Frontend

- Manter o componente principal responsável pela lógica da tela.
- Reutilizar padrões visuais já existentes, como cards, tabs e modais.
- Preferir funções pequenas e estados bem nomeados.
- Ao adicionar novos campos, manter consistência com o layout atual.

### 8.3. Microserviço

- Manter o microserviço leve e simples.
- Preservar o endpoint de notificação e o formato de resposta atual.
- Logs devem continuar claros e úteis para depuração.

## 9. Resumo prático

Ao trabalhar neste repositório, agentes devem priorizar:

- clareza do código;
- consistência com a arquitetura já existente;
- uso correto de EF Core, Dapper e React;
- manutenção do estilo visual e da experiência do usuário;
- implementação simples, sem excesso de abstração.
