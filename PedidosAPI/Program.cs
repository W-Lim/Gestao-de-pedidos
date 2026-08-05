using Microsoft.EntityFrameworkCore;
using PedidosAPI.Data;

// Habilita o comportamento legado de timestamps para o PostgreSQL não reclamar do fusohorário local
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// =========================================================
// 1. REGISTRO DE SERVIÇOS (Fica ANTES do builder.Build)
// =========================================================

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurando a conexão do PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configurando o CORS para permitir acesso do React
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// =========================================================
// CONSTRUÇÃO DA APLICAÇÃO (O app é construído AQUI)
// =========================================================
var app = builder.Build();

// =========================================================
// 2. PIPELINE DE REQUISIÇÕES (Fica DEPOIS do builder.Build)
// =========================================================

// Habilita o Swagger no ambiente local e no Docker
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

app.UseAuthorization();

app.MapControllers();

// Popula o banco automaticamente com os 5.000 pedidos ao iniciar
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.SeedAsync(dbContext);
}

app.Run();