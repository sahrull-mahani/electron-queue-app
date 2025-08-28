const db = require('./db')

module.exports = {
    getQueues: async () => {
        try {
            const sqlQuery = `
            SELECT 
                ap.*, 
                pk.nm_poli, 
                d.nm_dokter, 
                p.nm_pasien 
            FROM antrian_apotek ap
            INNER JOIN reg_periksa rp ON rp.no_rawat = ap.no_rawat
            INNER JOIN resep_obat ro ON ro.no_resep = ap.no_resep
            INNER JOIN poliklinik pk ON pk.kd_poli = ap.kd_poli
            INNER JOIN dokter d ON d.kd_dokter = ro.kd_dokter
            INNER JOIN pasien p ON p.no_rkm_medis = rp.no_rkm_medis
            WHERE ro.tgl_peresepan = CURDATE() AND ap.tanggal = CURDATE() AND ap.status = 'Baru'
            ORDER BY ap.nomor ASC
        `
            const [rows] = await db.query(sqlQuery)
            return rows
        } catch (error) {
            console.error('Error fetching queues:', error)
            throw error
        }
    },

    getNewestQueue: async () => {
        try {
            const [rows] = await db.query("SELECT * FROM antrian_apotek WHERE status = ? AND tanggal = CURDATE() ORDER BY nomor DESC LIMIT 1", ['Baru'])

            // mysql2 mengembalikan array, jadi kita ambil elemen pertama
            const queue = rows[0] || null

            if (!queue) {
                // Jika tidak ada hasil, kembalikan objek dengan nomor 0 atau null
                return { nomor: 0 }
            }
            return queue
        } catch (error) {
            console.error('Error fetching newest queue:', error)
            throw error // Lemparkan error
        }
    },

    getNowQueue: async () => {
        try {
            const [rows] = await db.query("SELECT * FROM antrian_apotek WHERE status = ? AND tanggal = CURDATE() ORDER BY nomor ASC LIMIT 1", ['Baru'])

            // mysql2 mengembalikan array, jadi kita ambil elemen pertama
            const queue = rows[0] || null

            if (!queue) {
                // Jika tidak ada hasil, kembalikan objek dengan nomor 0 atau null
                return { nomor: 0 }
            }
            return queue
        } catch (error) {
            console.error('Error fetching newest queue:', error)
            throw error // Lemparkan error
        }
    },

    getQueueSkipped: async () => {
        try {
            const sqlQuery = `
                SELECT 
                    ap.*, 
                    pk.nm_poli, 
                    d.nm_dokter, 
                    p.nm_pasien 
                FROM antrian_apotek ap
                INNER JOIN reg_periksa rp ON rp.no_rawat = ap.no_rawat
                INNER JOIN resep_obat ro ON ro.no_resep = ap.no_resep
                INNER JOIN poliklinik pk ON pk.kd_poli = ap.kd_poli
                INNER JOIN dokter d ON d.kd_dokter = ro.kd_dokter
                INNER JOIN pasien p ON p.no_rkm_medis = rp.no_rkm_medis
                WHERE ro.tgl_peresepan = CURDATE() AND ap.tanggal = CURDATE() AND ap.status = 'Lewat'
                ORDER BY ap.nomor ASC
            `
            const [rows] = await db.query(sqlQuery)
            return rows
        } catch (error) {
            console.error('Error fetching skipped queues:', error)
            throw error
        }
    },

    getTotalQueues: async () => {
        try {
            const [rows] = await db.query("SELECT COUNT(*) AS total FROM antrian_apotek WHERE tanggal = CURDATE()")
            const total = rows[0] || null

            if (!total) {
                return { nomor: 0 }
            }
            return total
        } catch (error) {
            console.error('Error fetching skipped queues:', error)
            throw error
        }
    },

    getTotalDoneQueues: async () => {
        try {
            const [rows] = await db.query("SELECT COUNT(*) AS total_selesai FROM antrian_apotek WHERE tanggal = CURDATE() AND status = ?", ['Selesai'])
            const total = rows[0] || null

            if (!total) {
                return { nomor: 0 }
            }
            return total
        } catch (error) {
            console.error('Error fetching skipped queues:', error)
            throw error
        }
    },

    addQueue: async (queue) => {
        try {
            // Cek apakah antrian sudah ada
            const [existingRows] = await db.query(
                `SELECT nomor FROM antrian_apotek WHERE nomor = ? AND status = ?`,
                [queue.nomor, queue.status]
            )

            // Jika belum ada, lakukan insert
            if (existingRows.length === 0) {
                const [result] = await db.query(
                    `INSERT INTO antrian_apotek (nomor, status) VALUES (?, ?)`,
                    [queue.nomor, queue.status]
                )
                // Kembalikan ID yang baru dibuat
                return result.insertId
            }
            return null // Antrian sudah ada, tidak ada yang ditambahkan
        } catch (error) {
            console.error('Error adding queue:', error)
            throw error
        }
    },

    updateQueue: async (queue) => {
        try {
            const [result] = await db.query(
                "UPDATE antrian_apotek SET status = ? WHERE nomor = ? AND tanggal = CURDATE()",
                [queue.status, queue.nomor]
            )
            return result.affectedRows > 0 // Mengembalikan true jika ada baris yang diperbarui
        } catch (error) {
            console.error('Error updating queue:', error)
            throw error
        }
    },

    clearSkipped: async () => {
        try {
            const [result] = await db.query(
                "UPDATE antrian_apotek SET status = ? WHERE status = ? AND tanggal = CURDATE()",
                ['Selesai', 'Lewat']
            )
            return result.affectedRows > 0
        } catch (error) {
            console.error('Error clearing skipped queues:', error)
            throw error
        }
    },

    resetQueue: async () => {
        try {
            // Hapus semua data
            await db.query(`DELETE FROM antrian_apotek`)

            // Reset AUTO_INCREMENT di MySQL
            await db.query(`ALTER TABLE antrian_apotek AUTO_INCREMENT = 1`)

            return true
        } catch (error) {
            console.error('Error resetting queue:', error)
            throw error
        }
    }
}