const { ipcRenderer } = require('electron')
const formPanggilanManual = document.getElementById('panggilan-manual')
const antrianDilewati = document.getElementById('antrian-dilewati')
const daftarAntrian = document.getElementById('daftar-antrian')
const button_call_again = document.getElementById('btn-call-again')
const button_next = document.getElementById('btn-next')
const button_skip = document.getElementById('btn-skip')
// const button_reset = document.getElementById('btn-reset')
const nomor_antrian = document.getElementById('nomor-antrian')
const clear_queue_skipped = document.getElementById('clear-skipped-queue')
const total_antrian = document.getElementById('total-antrian')

const updateQueue = async (number) => {
    const queues = await ipcRenderer.invoke('get-queues')
    nomor_antrian.textContent = number
    button_call_again.disabled = number ? false : true
    button_skip.disabled = queues.length ? false : true
    // button_reset.disabled = number ? false : true
    button_next.disabled = queues.length ? false : true
    getQueues()
}

const getNewestQueue = async () => {
    try {
        const queue = await ipcRenderer.invoke('get-now-queue')
        const number = queue.nomor ? queue.nomor - 1 : 0
        updateQueue(number)
    } catch (error) {
        console.error('Get antrian terbaru:', error)
    }
}
getNewestQueue()

// button_reset.addEventListener('click', function () {
//     ipcRenderer.invoke('reset-queue')
//     ipcRenderer.send('callNext', 0)
//     updateQueue(0)
//     getQueueSkipped()
// })

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

button_next.addEventListener('click', async () => {
    const nomor = parseInt(nomor_antrian.textContent)

    await ipcRenderer.invoke('update-queue', { nomor, status: 'Selesai' })
    ipcRenderer.send('callNext', nomor + 1)
    updateQueue(nomor + 1)
})

button_call_again.addEventListener('click', function () {
    const nomor = parseInt(nomor_antrian.textContent)
    ipcRenderer.send('callNext', nomor)
})

button_skip.addEventListener('click', async function () {
    const nomor = parseInt(nomor_antrian.textContent)

    await ipcRenderer.invoke('update-queue', { nomor, status: 'Lewat' })
    ipcRenderer.send('callNext', nomor + 1)
    updateQueue(nomor + 1)
    getQueueSkipped()
})

const getQueues = async (newQueue = null) => {
    const queues = await ipcRenderer.invoke('get-queues')
    if (newQueue) {
        queues.push(newQueue)
    }

    total_antrian.textContent = `Total Antrian ${queues.length}`
    button_next.disabled = !queues.length || queues.length == parseInt(nomor_antrian.textContent) ? true : false

    daftarAntrian.innerHTML = ''
    if (!queues.length) {
        daftarAntrian.innerHTML = `<h1 class="text-lg font-semibold text-center text-gray-500 italic font-mono mt-4 tracking-wider">Belum ada antrian</h1>`
    } else {
        let dataAntrian = ''
        queues.map((antrian) => {
            dataAntrian += `<li class="bg-white shadow overflow-hidden sm:rounded-md">
                    <span
                        class="block hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out">
                        <div class="px-4 py-4 flex items-center sm:px-6">
                            <div class="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <div class="leading-5 space-y-1 truncate">
                                        <h5 class="flex text-xs font-medium">${antrian.nm_poli}, ${antrian.nm_pasien}</h5>
                                        <h3 class="flex text-indigo-500 text-md font-semibold">${antrian.jam}</h3>
                                    </div>
                                    <div class="mt-2 flex">
                                        <div class="flex items-center text-sm leading-5 text-gray-500 space-x-1">
                                            <svg class="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor"
                                                viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                                <path
                                                    d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z">
                                                </path>
                                            </svg>
                                            <span>${antrian.nm_dokter}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="ml-5 flex-shrink-0">
                                <!-- Heroicon name: chevron-right -->
                                <h1 class="font-extrabold text-xl text-red-800">${antrian.nomor}</h1>
                            </div>
                        </div>
                    </span>
                </li>`
        })
        daftarAntrian.innerHTML = dataAntrian
    }
}
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
                    <h1 class="text-lg">Nomor ${skip.nomor}</h1>

                    <div class="inline-flex rounded-md shadow-xs" role="group">
                        <button type="button" data-nomor-antrian=${skip.nomor}
                            class="child-panggil-lagi px-4 py-2 text-sm font-medium bg-blue-500 text-white border border-gray-200 rounded-s-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">
                            Panggil
                        </button>
                        <button type="button" data-nomor=${skip.nomor}
                            class="child-selesai px-4 py-2 text-sm font-medium bg-green-500 text-white border border-gray-200 rounded-e-lg hover:bg-gray-100 hover:text-green-700 focus:z-10 focus:ring-2 focus:ring-green-700 focus:text-green-700">
                            Selesai
                        </button>
                    </div>
                </li>`
        })
        antrianDilewati.innerHTML = dataSkip
    }
}
getQueues()
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
        await ipcRenderer.invoke('update-queue', { nomor, status: 'Selesai' })
        getQueueSkipped()
    }
})

clear_queue_skipped.addEventListener('click', async function () {
    await ipcRenderer.invoke('clear-skipped')
    getQueueSkipped()
})

ipcRenderer.on('queueUpdateListed', (event, response) => {
    console.log('SOcket queueUpdateListed')
    console.log(response)
    getQueues(response)
})