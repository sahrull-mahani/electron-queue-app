const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const { io } = require('socket.io-client')
const model = require('./src/model/model')

const socket = io(process.env.WS) // Sesuaikan dengan port server Anda
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

    mainWindow.webContents.openDevTools()
    mainWindow.setFullScreen(true)
    mainWindow.loadFile('index.html')

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

    ipcMain.handle('get-total-queues', async () => {
        return await model.getTotalQueues()
    })

    ipcMain.handle('get-total-done-queues', async () => {
        return await model.getTotalDoneQueues()
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

ipcMain.on('callNext', (event, request) => {
    const { nomor, nm_pasien, no_resep, nm_poli, nm_dokter, action } = request
    let data = {
        nomor,
        location: 'apotek cmu'
    }
    if (action && action == 'panggil-antrian-dilewati') {
        data.nm_pasien = nm_pasien
        data.no_resep = no_resep
        data.nm_poli = nm_poli
        data.nm_dokter = nm_dokter
        data.action = action
    }
    socket.emit('nextQueue', data)
})