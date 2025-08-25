const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
dotenv.config()

const conn = mysql.createPool({
    host: process.env.HOST,
    user: process.env.USR,
    password: process.env.PASS,
    database: process.env.DB
})

module.exports = conn