const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { app } = require('electron')

const DB_PATH = path.join(__dirname, 'database.sqlite')

let db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Database error:', err)
    } else {
        console.log('Koneksi database berhasil...')
        initializeDatabase()
    }
})

const initializeDatabase = () => {
    db.serialize(async () => {
        db.run(`
            CREATE TABLE IF NOT EXISTS antrian (
            no_antrian INTEGER NOT NULL,
            status TEXT CHECK(status IN ('baru', 'dilewati')) NOT NULL
        )`)
    })
}

module.exports = db