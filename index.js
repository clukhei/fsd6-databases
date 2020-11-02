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
const SQL_FIND_BY_NAME = 'SELECT * FROM apps WHERE name LIKE ? limit ?'

app.get("/search", async(req,res)=> {
    console.log(req.query.search)
    const searched = req.query.search
    //acquire connection from the pool
    const conn= await pool.getConnection()

    try{
        //perform the query 
        // const result = await conn.query(SQL_FIND_BY_NAME, [`%${searched}%`, 10])
        // const recs = result[0]

        //destructuring
        const [recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [`%${searched}%`, 10])
        console.log(recs)
        res.status(200)
        res.type("text/html")
        res.render("index", {
            searched,
            recs
        })
    
    }catch(e){
        console.log(e)
    } finally {
        //release connection after executing all queries in try block or catch block
        // finally block will always be executed after try block
        // if try block has a return, before return is executed, finally will be executed
        conn.release()
    }
   
})
//start server
startApp(app, pool)