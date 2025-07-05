const { ipcRenderer } = require('electron')
const formPanggilanManual = document.getElementById('panggilan-manual')
const antrianDilewati = document.getElementById('antrian-dilewati')
const button_call_again = document.getElementById('btn-call-again')
const button_next = document.getElementById('btn-next')
const button_skip = document.getElementById('btn-skip')
const button_reset = document.getElementById('btn-reset')
const nomor_antrian = document.getElementById('nomor-antrian')
const clear_queue_skipped = document.getElementById('clear-skipped-queue')

const updateQueue = (number) => {
    nomor_antrian.textContent = number
    button_call_again.disabled = number ? false : true
    button_skip.disabled = number ? false : true
    button_reset.disabled = number ? false : true
}

const getNewestQueue = async () => {
    try {
        const queue = await ipcRenderer.invoke('get-newest-queue')
        const number = queue?.no_antrian ?? 0
        console.log(number)
        updateQueue(number)
    } catch (error) {
        console.error('Get antrian terbaru:', error)
    }
}
getNewestQueue()

button_reset.addEventListener('click', function () {
    ipcRenderer.invoke('reset-queue')
    ipcRenderer.send('callNext', 0)
    updateQueue(0)
    getQueueSkipped()
})

formPanggilanManual.addEventListener('submit', function (e) {
    e.preventDefault()

    const data = new FormData(this)

    let ent = {}
    for (let entry of data) {
        ent[entry[0]] = entry[1]
    }

    const { nomor } = ent
    if (nomor == '' || nomor < 0) {
        return dangerAlert('Masukan nomor antrian yang valid!')
    }

    ipcRenderer.send('callNext', nomor)
})

button_next.addEventListener('click', () => {
    const nomor = parseInt(nomor_antrian.textContent) + 1

    const saveAntrian = {
        no_antrian: nomor,
        status: 'baru'
    }

    console.log('Next Antrian:', saveAntrian)
    ipcRenderer.invoke('add-queue', saveAntrian)
    ipcRenderer.send('callNext', nomor)
    updateQueue(nomor)
})

button_call_again.addEventListener('click', function () {
    const nomor = parseInt(nomor_antrian.textContent)
    ipcRenderer.send('callNext', nomor)
})

button_skip.addEventListener('click', async function () {
    const nomor = parseInt(nomor_antrian.textContent)

    await ipcRenderer.invoke('update-queue', { nomor, status: 'dilewati' })

    const saveAntrian = {
        no_antrian: nomor + 1,
        status: 'baru'
    }

    console.log('Next Antrian:', saveAntrian)
    ipcRenderer.invoke('add-queue', saveAntrian)
    ipcRenderer.send('callNext', nomor + 1)
    updateQueue(nomor + 1)
    getQueueSkipped()
})

const getQueueSkipped = async () => {
    const queueSkipped = await ipcRenderer.invoke('get-queue-skipped')
    console.log(queueSkipped)

    antrianDilewati.innerHTML = ''
    if (!queueSkipped.length) {
        antrianDilewati.innerHTML = `<h1 class="text-lg font-semibold text-center text-gray-500 italic font-mono mt-4 tracking-wider">Tidak ada antrian yang dilewati</h1>`
    } else {
        let dataSkip = ''
        queueSkipped.map((skip) => {
            dataSkip += `<li
                    class="w-full px-4 py-2 border-b bg-orange-700 rounded-lg text-white font-semibold flex justify-between items-center">
                    <h1 class="text-lg">Nomor ${skip.no_antrian}</h1>

                    <div class="inline-flex rounded-md shadow-xs" role="group">
                        <button type="button" data-nomor-antrian=${skip.no_antrian}
                            class="child-panggil-lagi px-4 py-2 text-sm font-medium bg-blue-500 text-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">
                            Panggil
                        </button>
                        <button type="button" data-nomor=${skip.no_antrian}
                            class="child-selesai px-4 py-2 text-sm font-medium bg-green-500 text-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-green-700 focus:z-10 focus:ring-2 focus:ring-green-700 focus:text-green-700">
                            Selesai
                        </button>
                    </div>
                </li>`
        })
        antrianDilewati.innerHTML = dataSkip
    }
}
getQueueSkipped()

antrianDilewati.addEventListener('click', function (e) {
    if (e.target.classList.contains('child-panggil-lagi')) {
        const nomor = e.target.getAttribute('data-nomor-antrian')
        ipcRenderer.send('callNext', nomor)
    }
})
antrianDilewati.addEventListener('click', async function (e) {
    if (e.target.classList.contains('child-selesai')) {
        const nomor = e.target.getAttribute('data-nomor')
        console.log(nomor)
        await ipcRenderer.invoke('update-queue', { nomor, status: 'baru' })
        getQueueSkipped()
    }
})

clear_queue_skipped.addEventListener('click', async function () {
    await ipcRenderer.invoke('clear-skipped')
    getQueueSkipped()
})