const express = require('express')
const hbs = require('express-handlebars')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')

dotenv.config()
const app = express()
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000
app.use(express.static(__dirname + "/static"))
app.engine("hbs", hbs({defaultLayout: "default.hbs"}))
app.set("view engine", "hbs")


//configure database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306, //above 1024
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00',
    //multipleStatements: true   //allow sql multiple statement
})
const router = require('./apps')(pool)
app.use("/v1",router)

const startApp = async(app,pool) => {

    try {
        //acquire a connection from the connection pool. Once acquired connection cannot be used by others
        const conn = await pool.getConnection()

        console.log('Pinging database...')
        await conn.ping()

        //release the connection
        conn.release()

        app.listen(PORT, () => {
            console.log(`${PORT} started after connection`)
        })
    }
    catch(e){
        console.error('cannot ping database', e)
    }
}




// SQL queries-- never ever use string concatenation for sql query
// ? are placeholder

//start server
startApp(app, pool)