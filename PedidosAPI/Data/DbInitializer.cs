using Bogus;
using Microsoft.EntityFrameworkCore;
using PedidosAPI.Models;

namespace PedidosAPI.Data
{
    public static class DbInitializer
    {
        public static async Task SeedAsync(AppDbContext context)
        {
            await context.Database.MigrateAsync();

            if (await context.Orders.AnyAsync())
            {
                return;
            }

            var itemFaker = new Faker<OrderItem>("pt_BR")
                .RuleFor(i => i.ProductName, f => f.Commerce.ProductName())
                .RuleFor(i => i.Quantity, f => f.Random.Number(1, 5))
                .RuleFor(i => i.UnitPrice, f => Math.Round(f.Random.Decimal(10, 300), 2));

            var orderFaker = new Faker<Order>("pt_BR")
                .RuleFor(o => o.CustomerName, f => f.Name.FullName())
                // .ToUniversalTime() garante que a data esteja no formato UTC aceito pelo PostgreSQL
                .RuleFor(o => o.OrderDate, f => f.Date.Past(1).ToUniversalTime())
                .RuleFor(o => o.Items, f => itemFaker.Generate(f.Random.Number(1, 4)));

            var orders = orderFaker.Generate(5000);

            foreach (var order in orders)
            {
                order.TotalAmount = order.Items.Sum(item => item.Quantity * item.UnitPrice);
            }

            await context.Orders.AddRangeAsync(orders);
            await context.SaveChangesAsync();
        }
    }
}