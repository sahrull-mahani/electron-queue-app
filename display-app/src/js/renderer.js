const { ipcRenderer } = require('electron')
const queueNumberDisplay = document.getElementById('nomor-antrian')
const daftarAntrian = document.getElementById('daftar-antrian')
const namaPasien = document.getElementById('nama-pasien')
const nomorResep = document.getElementById('nomor-resep')
const namaPoli = document.getElementById('nama-poli')
const namaDokter = document.getElementById('nama-dokter')
const animasiSkrol = document.querySelector('.animasi_skrol')

// Inisialisasi Odometer dengan nilai awal = defaultValue
const odometer = new Odometer({
    el: queueNumberDisplay,
    value: '0',
    format: '',
})

// Render nilai awal
odometer.render(queueNumberDisplay.textContent)

// Kecepatan gulir (dalam piksel per interval)
const scrollSpeed = .5
let scrollPosition = 0
let scrollDirection = 1 // 1 untuk ke bawah, -1 untuk ke atas

const startAutoScroll = () => {
    // Jalankan interval setiap 25 milidetik (40 kali per detik)
    setInterval(() => {
        // Pindahkan posisi gulir sesuai arah
        scrollPosition += scrollSpeed * scrollDirection
        animasiSkrol.scrollTop = scrollPosition

        // Cek jika sudah mencapai akhir konten (bawah)
        if (animasiSkrol.scrollTop + animasiSkrol.clientHeight >= animasiSkrol.scrollHeight) {
            scrollDirection = -1 // Ubah arah menjadi ke atas
        }
        // Cek jika sudah mencapai awal konten (atas)
        else if (animasiSkrol.scrollTop <= 0) {
            scrollDirection = 1 // Ubah arah menjadi ke bawah
        }
    }, 25)
}

// Jalankan fungsi auto-scroll saat halaman dimuat
window.addEventListener('load', () => {
    startAutoScroll()
    getNowQueue()
    getQueues()
})

ipcRenderer.on('queueUpdated', async (event, response) => {
    const { total } = await ipcRenderer.invoke('get-total-queues')
    const { total_selesai } = await ipcRenderer.invoke('get-total-done-queues')
    const { nomor, nm_pasien, no_resep, nm_poli, nm_dokter, action } = response

    queueNumberDisplay.textContent = nomor

    console.log(response)

    if (total == total_selesai || action == 'done') {
        queueNumberDisplay.textContent = 0
        video.style.display = 'block'
        video.nextElementSibling.style.display = 'none'
        daftarAntrian.innerHTML = `<h1 class="text-lg font-semibold text-center text-red-800 bg-gray-100 italic font-mono mt-4 tracking-wider">Belum ada antrian</h1>`
    }

    if (nomor) {
        if (action == 'panggil-antrian-dilewati') {
            video.style.display = 'none'
            video.nextElementSibling.style.display = 'flex'
            namaPasien.textContent = nm_pasien
            nomorResep.textContent = no_resep
            namaPoli.textContent = nm_poli
            namaDokter.textContent = nm_dokter
        } else {
            getNowQueue()
        }
        callAudio(nomor)
        getQueues()
    }

    // Update ke nilai baru (pastikan nilai lebih besar dari sebelumnya)
    setTimeout(() => {
        odometer.update(nomor)
    }, 1000)
})

ipcRenderer.on('queueUpdateListed', async (event, response) => {
    getQueues(response)
})

const getNowQueue = async () => {
    try {
        const video = document.getElementById('video')
        const queue = await ipcRenderer.invoke('get-now-queue')
        const number = queue ? (queue.nomor > 1 ? queue.nomor : 0) : 0
        queueNumberDisplay.textContent = number
        if (number) {
            video.style.display = 'none'
            video.nextElementSibling.style.display = 'flex'
            namaPasien.textContent = queue.nm_pasien
            nomorResep.textContent = queue.no_resep
            namaPoli.textContent = queue.nm_poli
            namaDokter.textContent = queue.nm_dokter
        } else {
            video.style.display = 'block'
            video.nextElementSibling.style.display = 'none'
        }
    } catch (error) {
        console.error('Get antrian sekarang:', error)
    }
}

const getQueues = async (newQueue = null) => {
    const queues = await ipcRenderer.invoke('get-queues')
    if (newQueue) {
        queues.push(newQueue)
    }

    daftarAntrian.innerHTML = ''
    if (!queues.length) {
        daftarAntrian.innerHTML = `<h1 class="text-lg font-semibold text-center text-red-800 bg-gray-100 italic font-mono mt-4 tracking-wider">Belum ada antrian</h1>`
    } else {
        let dataAntrian = ''
        queues.map((antrian) => {
            dataAntrian += `<tr>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white">
                            <h2 class="font-bold text-2xl">${antrian.nm_pasien}</h2>
                        </td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white">
                            <h2 class="font-bold text-2xl">${antrian.nm_poli}</h2>
                        </td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white">
                            <h2 class="font-bold text-2xl">${antrian.nm_dokter}</h2>
                        </td>
                        <td class="px-5 py-5 border-b border-gray-200 bg-white">
                            <h2 class="font-bold text-2xl py-2 px-3 bg-green-400 text-green-950 rounded-2xl text-center">${antrian.nomor}</h2>
                        </td>
                    </tr>`
        })
        daftarAntrian.innerHTML = dataAntrian
    }
}

const updateWaktu = () => {
    const sekarang = new Date()
    document.getElementById('waktu-realtime').textContent =
        sekarang.toLocaleTimeString('en-US', { hour12: false })

    requestAnimationFrame(updateWaktu)
}
updateWaktu()

const formatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
})

const tanggalIndonesia = formatter.format(new Date())
document.getElementById('tanggal-realtime').textContent = tanggalIndonesia

// Fungsi untuk memutar sequence audio
function playAudioSequence(audioKeys) {
    if (audioKeys.length === 0) return

    const currentAudio = new Audio('./assets/audio/speech antrian/' + audioKeys[0] + '.mp3')
    if (!currentAudio) {
        console.error(`Audio ${audioKeys[0]} tidak ditemukan`)
        return
    }

    currentAudio.play()
        .then(() => console.log(`Audio ${audioKeys[0]} berhasil diputar`))
        .catch(error => console.error(`Gagal memutar audio ${audioKeys[0]}:`, error))

    setTimeout(() => {
        const remainingAudios = audioKeys.slice(1)
        if (remainingAudios.length > 0) {
            playAudioSequence(remainingAudios)
        }
    }, 700)
}

const callAudio = (nomor) => {
    const audio = new Audio('./assets/audio/tingtung.mp3')
    const audio_nomor_antrian = new Audio('./assets/audio/speech antrian/nomor antrian.mp3')

    const array_numbers = String(nomor).split('')
    let numbers = [1]

    if (nomor < 20) {
        numbers = [nomor]
    } else if (nomor >= 20 && nomor % 10 === 0 && nomor < 100) {
        numbers = array_numbers
    } else if (nomor >= 20 && nomor < 100) {
        array_numbers.splice(1, 0, '0')
        numbers = array_numbers
    } else if (nomor == 100) {
        numbers = [100]
    } else if (nomor > 100 && nomor < 120) {
        array_numbers.shift()
        numbers = [100]
        numbers.push(parseInt(array_numbers.join('')))
    } else if (nomor >= 120 && nomor < 200) {
        numbers = [100]
        array_numbers.shift()
        numbers.push(...array_numbers)
        if (numbers[2] > 0) {
            numbers.splice(2, 0, '0')
        }
    } else if (nomor >= 200 && nomor < 1000) {
        numbers = [array_numbers[0], '00']
        number_2digits = parseInt(array_numbers.slice(1).join(''))
        if (number_2digits > 0 && number_2digits < 20) {
            numbers.push(number_2digits)
        } else if (number_2digits > 19) {
            if (number_2digits % 10 === 0) {
                numbers.push(...(String(number_2digits).split('')))
            } else {
                numbers.push(...(String(number_2digits).split('')))
                numbers.splice(3, 0, '0')
            }
        }
    }

    numbers.push('menuju ke loket penerimaan obat')

    audio.play()
        .catch(error => console.error("Gagal memutar audio:", error))

    audio.onended = function () {
        audio_nomor_antrian.play()
            .catch(error => console.error("Gagal memutar audio:", error))
        setTimeout(() => {
            playAudioSequence(numbers)
        }, 1100)
    }
}