const http = require('http')
const { Server } = require("socket.io")

const httpServer = http.createServer()
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Atur origin sesuai kebutuhan
        methods: ["GET", "POST"]
    }
})

io.on('connection', async (socket) => {
    console.log('User connected:', socket.id)

    socket.on('nextQueue', async (nomor) => {
        io.emit('updateQueue', nomor) // Kirim nomor antrian terbaru ke semua klien yang terhubung
    })

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id)
    })
})

const PORT = 3000
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server listening on port ${PORT}`)
})