namespace PedidosAPI.Models
{
    public class Order
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }

        // Relacionamento: Um Pedido tem VÁRIOS Itens
        public List<OrderItem> Items { get; set; } = new List<OrderItem>();
    }
}