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
    port: parseInt(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, 
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    timezone: '+08:00',
    //multipleStatements: true   //allow sql multiple statement
})

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

app.get("/", (req, res) => {
    res.status(200)
    res.type("text/html")
    res.render("index")
})
// SQL queries-- never ever use string concatenation for sql query
// ? are placeholder
const SQL_FIND_BY_NAME = 'SELECT * FROM apps WHERE name LIKE ? limit ? offset ?'
const SQL_COUNT_FIND_BY_NAME = 'SELECT COUNT(*) AS namesCount FROM apps WHERE name LIKE ?'
let offset = 0
let recordsCount 
let totalPagesPerSearch
let currentPage
let searchRecord 
let prevButtonState = true
let nextButtonState = true

app.get("/search", async(req,res)=> {
    offset = 0 
    currentPage = 1
    searchRecord = req.query.search
    //acquire connection from the pool
    const conn= await pool.getConnection()

    try{
        //perform the query 
        // const result = await conn.query(SQL_FIND_BY_NAME, [`%${searched}%`, 10])
        // const recs = result[0]
        //destructuring
        const [recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [`%${searchRecord}%`, 10, offset])
        const [[countRes]] = await conn.query(SQL_COUNT_FIND_BY_NAME, [`%${searchRecord}%`])
        //determine pagination number
        recordsCount = countRes.namesCount //dummy number for searching games
        totalPagesPerSearch = Math.ceil(recordsCount / 10)
        render(recs, searchRecord, res)
        console.log(currentPage, "the current page")
    }catch(e){
        console.log(e)
    } finally {
        //release connection after executing all queries in try block or catch block
        // finally block will always be executed after try block
        // if try block has a return, before return is executed, finally will be executed
        conn.release()
    }
   
})
app.get("/next", async(req,res)=> {
    offset = currentPage * 10
    //set the new current page
    if (currentPage < totalPagesPerSearch) {
        currentPage += 1
    } 
    console.log(currentPage, "after pressing next")
    const conn= await pool.getConnection()
    try{
        const [recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [`%${searchRecord}%`, 10, offset])
        render(recs, searchRecord,res)
 
    }catch(e){
        console.log(e)
    } finally {
        conn.release()
    }
    
})
app.get("/prev", async(req,res)=> {
    console.log(totalPagesPerSearch)
    if (currentPage > 1) {
        currentPage -= 1
    } 
    offset = (currentPage -1) * 10
    console.log(offset, "after pressing prev")
    const conn= await pool.getConnection()
    try{
        const [recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [`%${searchRecord}%`, 10, offset])
        render(recs, searchRecord, res)
    }catch(e){
        console.log(e)
    } finally {
        conn.release()
    }
})

const render = (recs, searchRecord, res) => {
    res.status(200)
    res.type("text/html")
    res.render("index", {
        searchRecord,
        recs
    }) 
}

//start server
startApp(app, pool)