const db = require('./db')
module.exports = {
    getQueues: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM antrian", [], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    },

    getNewestQueue: () => {
        return new Promise((resolve, reject) => {
            db.get("SELECT * FROM antrian WHERE status = ? ORDER BY no_antrian DESC LIMIT 1", ['baru'], async (err, queue) => {
                if (err) return reject(err)
                if (!queue) return resolve(0)
                else return resolve(queue)
            })
        })
    },

    getQueueSkipped: () => {
        return new Promise((resolve, reject) => {
            db.all("SELECT * FROM antrian WHERE status = ?", ['dilewati'], (err, rows) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })
    },

    addQueue: async (queue) => {
        return new Promise((resolve, reject) => {
            try {
                db.get(`SELECT no_antrian FROM antrian WHERE no_antrian = ? AND status = ?`,
                    [queue.no_antrian, queue.status], (err, existingRow) => {
                        if (err) return reject(err)

                        // Jika belum ada insert
                        if (!existingRow) {
                            // Jika belum ada, lakukan insert
                            db.run(`INSERT INTO antrian (no_antrian, status) VALUES (?, ?)`,
                                [queue.no_antrian, queue.status],
                                (err) => {
                                    if (err) reject(err)
                                    else resolve(this.lastID)
                                }
                            )
                        }
                    })
            } catch (error) {
                reject(error)
            }
        })
    },

    updateQueue: (queue) => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE antrian SET status = ? WHERE no_antrian = ?", [queue.status, queue.nomor], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    },

    clearSkipped: () => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE antrian SET status = ?", ['baru'], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    },

    resetQueue: () => {
        return new Promise((resolve, reject) => {
            db.run(`DELETE FROM antrian`, [], (err) => {
                if (err) return reject(err)

                // Coba reset sequence, tapi tangani error jika tabel tidak ada
                db.run(`DELETE FROM sqlite_sequence WHERE name = 'antrian'`, [], (err) => {
                    // Abaikan error jika tabel tidak ada
                    resolve(true)
                })
            })
        })
    }
}