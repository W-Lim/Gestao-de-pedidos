const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 4000;

// Endpoint chamado pela API .NET quando um pedido e criado
app.post('/api/notifications', (req, res) => {
    const { orderId, customerName, totalAmount } = req.body;

    console.log('\n==================================================');
    console.log(`📩 [MICROSERVIÇO NODE.JS] Notificação Recebida!`);
    console.log(`📦 Pedido #${orderId}`);
    console.log(`👤 Cliente: ${customerName}`);
    console.log(`💰 Valor Total: R$ ${totalAmount?.toFixed(2)}`);
    console.log(`✅ Status: E-mail de confirmação enviado ao cliente com sucesso!`);
    console.log('==================================================\n');

    return res.status(200).json({ 
        status: 'success', 
        message: `Notificação do pedido #${orderId} processada com sucesso!` 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Microserviço Node.js rodando na porta ${PORT}`);
});