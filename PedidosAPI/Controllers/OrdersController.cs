using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PedidosAPI.Data;
using PedidosAPI.DTOs;
using PedidosAPI.Models;

namespace PedidosAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly string _connectionString;

        public OrdersController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // 1. LISTAR PEDIDOS PAGINADO (EF Core com AsNoTracking)
        [HttpGet]
        public async Task<ActionResult<PagedResultDto<Order>>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 10;

            var totalItems = await _context.Orders.CountAsync();

            var items = await _context.Orders
                .AsNoTracking() // Não faz tracking de memória, melhorando a performance
                .Include(o => o.Items)
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = new PagedResultDto<Order>
            {
                Items = items,
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems
            };

            return Ok(result);
        }

        // 2. FATURAMENTO POR PERÍODO (Dapper com SQL Direto Otimizado)
        [HttpGet("revenue")]
        public async Task<ActionResult<IEnumerable<DailyRevenueDto>>> GetRevenue([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Ajusta o intervalo para cobrir o dia inteiro até as 23:59:59
            var start = startDate.Date;
            var end = endDate.Date.AddDays(1).AddTicks(-1);

            // Query SQL direta agregando por dia
            var sql = @"
                SELECT 
                    CAST(""OrderDate"" AS DATE) as Date,
                    SUM(""TotalAmount"") as TotalRevenue,
                    COUNT(""Id"") as TotalOrders
                FROM ""Orders""
                WHERE ""OrderDate"" >= @start AND ""OrderDate"" <= @end
                GROUP BY CAST(""OrderDate"" AS DATE)
                ORDER BY Date ASC;";

            using var connection = new NpgsqlConnection(_connectionString);
            var revenueData = await connection.QueryAsync<DailyRevenueDto>(sql, new { start, end });

            return Ok(revenueData);
        }

        // 3. CRIAR PEDIDO (EF Core)
        [HttpPost]
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

            // Calcula o valor total no backend para segurança
            order.TotalAmount = order.Items.Sum(i => i.Quantity * i.UnitPrice);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrders), new { id = order.Id }, order);
        }
    }
}