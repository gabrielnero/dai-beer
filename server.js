const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Criar servidor HTTP para Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configuração do MongoDB
const MONGODB_URI = 'mongodb+srv://daibeercervejaria:MnjLxGolI3Q6eTEA@cluster0.ndziwas.mongodb.net/daibeer?retryWrites=true&w=majority&appName=Cluster0';

// Schemas do MongoDB
const produtoSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    descricao: { type: String },
    preco: { type: Number, required: true },
    categoria: { type: String, required: true },
    imagem: { type: String },
    disponivel: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now }
});

const pedidoSchema = new mongoose.Schema({
    numero_pedido: { type: String, required: true, unique: true },
    cliente_nome: { type: String, required: true },
    cliente_telefone: { type: String, required: true },
    cliente_endereco: { type: String, required: true },
    cliente_email: { type: String },
    observacoes: { type: String },
    forma_pagamento: { type: String, required: true },
    tipo_entrega: { type: String, required: true },
    data_entrega: { type: Date },
    status: { type: String, default: 'pendente' },
    total: { type: Number, required: true },
    itens: [{
        produto_nome: { type: String, required: true },
        quantidade: { type: Number, required: true },
        preco_unitario: { type: Number, required: true },
        subtotal: { type: Number, required: true }
    }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Models
const Produto = mongoose.model('Produto', produtoSchema);
const Pedido = mongoose.model('Pedido', pedidoSchema);

// Conectar ao MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado ao MongoDB Atlas com sucesso!');
        
        // Inserir produtos iniciais se não existirem
        await insertInitialProducts();
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
}

// Inserir produtos iniciais
async function insertInitialProducts() {
    try {
        // Limpar produtos existentes para atualizar com novas imagens
        await Produto.deleteMany({});
        console.log('Produtos existentes removidos para atualização');

        const produtos = [
            // Chopps (Chopp Pilsen primeiro)
            { nome: 'Chopp Pilsen', descricao: 'Chopp clássico e refrescante', preco: 12.00, categoria: 'chopp', imagem: 'todos_chopps.jpg' },
            { nome: 'American IPA', descricao: 'Chopp com sabor marcante de lúpulo', preco: 15.00, categoria: 'chopp', imagem: 'todos_chopps.jpg' },
            { nome: 'American Pale Ale', descricao: 'Chopp equilibrado e aromático', preco: 15.00, categoria: 'chopp', imagem: 'todos_chopps.jpg' },
            { nome: 'Chopp de Uva', descricao: 'Chopp com sabor único de uva', preco: 15.00, categoria: 'chopp', imagem: 'todos_chopps.jpg' },
            
            // Barris
            { nome: 'Barril 20 Litros', descricao: 'Barril de chopp para festas pequenas', preco: 240.00, categoria: 'barril', imagem: 'barris.jpg' },
            { nome: 'Barril 30 Litros', descricao: 'Barril de chopp para festas médias', preco: 360.00, categoria: 'barril', imagem: 'barris.jpg' },
            { nome: 'Barril 50 Litros', descricao: 'Barril de chopp para festas grandes', preco: 600.00, categoria: 'barril', imagem: 'barris.jpg' },
            
            // Energéticos
            { nome: 'Energético Tradicional 350ml', descricao: 'Bebida energética natural', preco: 4.99, categoria: 'energetico', imagem: 'energetico.jpeg' }
        ];

        await Produto.insertMany(produtos);
        console.log('Produtos iniciais inseridos com sucesso!');
        
        produtos.forEach(produto => {
            console.log(`Produto inserido: ${produto.nome} - R$ ${produto.preco}`);
        });
    } catch (error) {
        console.error('Erro ao inserir produtos iniciais:', error);
    }
}

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Socket.IO
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    socket.on('join-socios', () => {
        socket.join('socios');
        console.log('Sócio conectado:', socket.id);
    });
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

// Rotas
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/pedidos', (req, res) => {
    res.sendFile(__dirname + '/pedidos.html');
});

// JWT Secret (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'daibeer_secret_key_2024';

// Middleware de autenticação JWT
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Token de acesso necessário' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
    }
};

// Rota para página de login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Tentativa de login:', { username, password: password ? '***' : 'undefined' });
        
        // Credenciais básicas (em produção, usar banco de dados)
        const validCredentials = {
            'admin': 'daibeer2024',
            'socio1': 'socio123',
            'socio2': 'socio456'
        };
        
        if (validCredentials[username] && validCredentials[username] === password) {
            const token = jwt.sign(
                { 
                    username: username, 
                    role: 'admin',
                    loginTime: new Date()
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log('Login bem-sucedido para:', username);
            res.json({
                success: true,
                token: token,
                user: {
                    username: username,
                    role: 'admin'
                }
            });
        } else {
            console.log('Credenciais inválidas para:', username);
            res.status(401).json({ message: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para verificar token
app.get('/api/auth/verify', authenticateAdmin, (req, res) => {
    console.log('Token verificado com sucesso para:', req.user.username);
    res.json({
        valid: true,
        user: req.user
    });
});

// Rota para logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logout realizado com sucesso' });
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

// API - Produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const produtos = await Produto.find({ disponivel: true }).sort({ categoria: 1, nome: 1 });
        res.json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API - Pedidos
app.post('/api/pedidos', async (req, res) => {
    try {
        const { cliente, itens, forma_pagamento, tipo_entrega, data_entrega, observacoes } = req.body;
        
        // Calcular total
        const total = itens.reduce((sum, item) => sum + (item.quantidade * item.preco_unitario), 0);
        
        // Gerar número do pedido
        const numeroPedido = 'DB' + Math.random().toString(36).substr(2, 8).toUpperCase();
        
        // Criar pedido
        const pedido = new Pedido({
            numero_pedido: numeroPedido,
            cliente_nome: cliente.nome,
            cliente_telefone: cliente.telefone,
            cliente_endereco: cliente.endereco,
            cliente_email: cliente.email,
            observacoes: observacoes,
            forma_pagamento: forma_pagamento,
            tipo_entrega: tipo_entrega,
            data_entrega: data_entrega,
            total: total,
            itens: itens
        });
        
        await pedido.save();
        
        // Enviar notificação via WebSocket
        const notificacao = {
            numero_pedido: numeroPedido,
            cliente_nome: cliente.nome,
            total: total,
            timestamp: new Date()
        };
        
        io.to('socios').emit('novo-pedido', notificacao);
        console.log(`Notificação enviada para sócios: Novo pedido ${numeroPedido}`);
        
        // Enviar email (opcional)
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // Enviar para o próprio negócio
                subject: `Novo Pedido - ${numeroPedido}`,
                html: `
                    <h2>Novo Pedido Recebido!</h2>
                    <p><strong>Número:</strong> ${numeroPedido}</p>
                    <p><strong>Cliente:</strong> ${cliente.nome}</p>
                    <p><strong>Telefone:</strong> ${cliente.telefone}</p>
                    <p><strong>Endereço:</strong> ${cliente.endereco}</p>
                    <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
                    <p><strong>Forma de Pagamento:</strong> ${forma_pagamento}</p>
                `
            });
        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
        }
        
        res.json({ 
            success: true, 
            numero_pedido: numeroPedido,
            message: 'Pedido realizado com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// APIs para o App Android
app.get('/api/mobile/pedidos/pendentes', async (req, res) => {
    try {
        const pedidos = await Pedido.find({ status: 'pendente' })
            .sort({ created_at: -1 })
            .limit(50);
        res.json(pedidos);
    } catch (error) {
        console.error('Erro ao buscar pedidos pendentes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/mobile/pedidos', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const { status, data_inicio, data_fim, page = 1, limit = 20 } = req.query;
        
        let filtro = {};
        if (status) filtro.status = status;
        if (data_inicio || data_fim) {
            filtro.created_at = {};
            if (data_inicio) filtro.created_at.$gte = new Date(data_inicio);
            if (data_fim) filtro.created_at.$lte = new Date(data_fim);
        }
        
        const skip = (page - 1) * limit;
        const pedidos = await Pedido.find(filtro)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));
            
        const total = await Pedido.countDocuments(filtro);
        
        res.json({
            pedidos,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/mobile/pedidos/:id/aprovar', authenticateAdmin, async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(
            req.params.id,
            { status: 'aprovado', updated_at: new Date() },
            { new: true }
        );
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json({ success: true, pedido });
    } catch (error) {
        console.error('Erro ao aprovar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/mobile/pedidos/:id/negar', authenticateAdmin, async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(
            req.params.id,
            { status: 'negado', updated_at: new Date() },
            { new: true }
        );
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json({ success: true, pedido });
    } catch (error) {
        console.error('Erro ao negar pedido:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.put('/api/mobile/pedidos/:id/entregue', authenticateAdmin, async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(
            req.params.id,
            { status: 'entregue', updated_at: new Date() },
            { new: true }
        );
        
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado' });
        }
        
        res.json({ success: true, pedido });
    } catch (error) {
        console.error('Erro ao marcar como entregue:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/mobile/dashboard', async (req, res) => {
    try {
        const hoje = new Date();
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        
        // Pedidos do dia
        const pedidosHoje = await Pedido.find({
            created_at: {
                $gte: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
                $lt: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
            }
        });
        
        // Pedidos do mês
        const pedidosMes = await Pedido.find({
            created_at: { $gte: inicioMes }
        });
        
        const vendasHoje = pedidosHoje.reduce((sum, p) => sum + p.total, 0);
        const vendasMes = pedidosMes.reduce((sum, p) => sum + p.total, 0);
        
        res.json({
            pedidos_hoje: pedidosHoje.length,
            vendas_hoje: vendasHoje,
            pedidos_mes: pedidosMes.length,
            vendas_mes: vendasMes
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get('/api/mobile/sync', async (req, res) => {
    try {
        const { ultima_sincronizacao } = req.query;
        
        let filtro = {};
        if (ultima_sincronizacao) {
            filtro.updated_at = { $gt: new Date(ultima_sincronizacao) };
        }
        
        const pedidos = await Pedido.find(filtro).sort({ updated_at: 1 });
        
        res.json({
            pedidos,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Erro na sincronização:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API para lembretes de entrega
app.get('/api/mobile/lembretes', async (req, res) => {
    try {
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
        
        const pedidosHoje = await Pedido.find({
            data_entrega: {
                $gte: inicioDia,
                $lt: fimDia
            },
            status: { $in: ['aprovado', 'pendente'] }
        }).sort({ data_entrega: 1 });
        
        res.json({
            pedidos: pedidosHoje,
            data: hoje.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Erro ao buscar lembretes:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// API para dashboard com dados reais
app.get('/api/mobile/dashboard', authenticateAdmin, requireAdmin, async (req, res) => {
    try {
        const hoje = new Date();
        const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
        
        // Buscar todos os pedidos
        const todosPedidos = await Pedido.find({});
        
        // Calcular estatísticas
        const pedidosHoje = todosPedidos.filter(p => {
            const dataPedido = new Date(p.created_at);
            return dataPedido >= inicioDia && dataPedido < fimDia;
        });
        
        const pedidosMes = todosPedidos.filter(p => {
            const dataPedido = new Date(p.created_at);
            return dataPedido >= inicioMes && dataPedido < fimMes;
        });
        
        const pedidosPendentes = todosPedidos.filter(p => p.status === 'pendente').length;
        const pedidosAprovados = todosPedidos.filter(p => p.status === 'aprovado').length;
        const pedidosEntregues = todosPedidos.filter(p => p.status === 'entregue').length;
        const pedidosCancelados = todosPedidos.filter(p => p.status === 'cancelado').length;
        
        const vendasHoje = pedidosHoje.reduce((total, p) => total + p.total, 0);
        const vendasMes = pedidosMes.reduce((total, p) => total + p.total, 0);
        
        // Produtos mais vendidos
        const produtosVendidos = {};
        todosPedidos.forEach(pedido => {
            pedido.itens.forEach(item => {
                if (produtosVendidos[item.produto_nome]) {
                    produtosVendidos[item.produto_nome] += item.quantidade;
                } else {
                    produtosVendidos[item.produto_nome] = item.quantidade;
                }
            });
        });
        
        const produtoMaisVendido = Object.entries(produtosVendidos)
            .sort(([,a], [,b]) => b - a)[0];
        
        res.json({
            pedidos_hoje: pedidosHoje.length,
            pedidos_mes: pedidosMes.length,
            pedidos_pendentes: pedidosPendentes,
            pedidos_aprovados: pedidosAprovados,
            pedidos_entregues: pedidosEntregues,
            pedidos_cancelados: pedidosCancelados,
            vendas_hoje: vendasHoje,
            vendas_mes: vendasMes,
            produto_mais_vendido: produtoMaisVendido ? produtoMaisVendido[0] : 'Nenhum',
            total_produtos_vendidos: produtoMaisVendido ? produtoMaisVendido[1] : 0,
            total_pedidos: todosPedidos.length
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Iniciar servidor
async function startServer() {
    await connectToMongoDB();
    
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
        console.log(`Acesse pela rede: http://192.168.1.100:${PORT}`);
        console.log(`Socket.IO ativo para notificações em tempo real`);
        console.log(`MongoDB Atlas conectado com sucesso!`);
    });
}

startServer().catch(console.error);
