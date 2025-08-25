const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const { io } = require('socket.io-client')
const model = require('./src/model/model')

const socket = io('http://localhost:3000') // Sesuaikan dengan port server Anda
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        focusable: true,
        icon: __dirname + '/assets/img/logo.png',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Untuk contoh sederhana ini
        },
    })

    // mainWindow.webContents.openDevTools()
    mainWindow.loadFile('index.html')
    // mainWindow.setFullScreen(true)

    // Menghapus menu bar sepenuhnya
    Menu.setApplicationMenu(null)

    mainWindow.on('closed', () => {
        mainWindow = null
    })

    ipcMain.handle('get-queues', async () => {
        return await model.getQueues()
    })

    ipcMain.handle('add-queue', async (e, queue) => {
        return await model.addQueue(queue)
    })

    ipcMain.handle('get-newest-queue', async () => {
        return await model.getNewestQueue()
    })

    ipcMain.handle('get-now-queue', async () => {
        return await model.getNowQueue()
    })

    ipcMain.handle('reset-queue', async () => {
        return await model.resetQueue()
    })

    ipcMain.handle('update-queue', async (e, queue) => {
        return await model.updateQueue(queue)
    })

    ipcMain.handle('get-queue-skipped', async () => {
        return await model.getQueueSkipped()
    })

    ipcMain.handle('clear-skipped', async () => {
        return await model.clearSkipped()
    })

    socket.on('updateQueueLists', (response) => {
        if (mainWindow) {
            console.log(response)
            if (response.location == 'apotek cmu') {
                mainWindow.webContents.send('queueUpdateListed', response)
            }
        }
    })
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('callNext', (event, nomor) => {
    socket.emit('nextQueue', {
        nomor: nomor,
        location: 'apotek cmu'
    })
})