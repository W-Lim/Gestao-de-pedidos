using Microsoft.EntityFrameworkCore;
using PedidosAPI.Models;

namespace PedidosAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Order> Orders { get; set; } = null!;
        public DbSet<OrderItem> OrderItems { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Criando um Índice na coluna OrderDate.
            // Isso faz a busca por período (faturamento) ser instantânea mesmo com milhares de registros!
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderDate);
        }
    }
}