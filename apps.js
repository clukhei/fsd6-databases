const express = require('express')

const SQL_FIND_BY_NAME = 'SELECT * FROM apps WHERE name LIKE ? limit ? offset ?'
const SQL_COUNT_FIND_BY_NAME = 'SELECT COUNT(*) AS namesCount FROM apps WHERE name LIKE ?'
const SQL_GET_NAME_ID = 'SELECT app_id, name FROM playstore.apps limit ? offset ?'
const SQL_GET_BY_ID = 'SELECT * FROM playstore.apps WHERE app_id = ?'

const r = function(p) {
    const router = express.Router()
    const pool = p
    router.get('/app', async(req,res) => {
        const conn= await pool.getConnection()
        try{
            const result = await conn.query(SQL_GET_NAME_ID, [10, 10])
        
            const recs = result[0]
            console.log(recs)
            res.status(200)
            res.type("text/html")
            res.render("app", {recs})
            
        } catch (e){
            res.status(500)
            res.type('text/html')
            res.send(JSON.stringify(e))
        } finally {
            conn.release()
        }
    })
    
    router.get('/app/:appId', async(req,res) => {
        const conn = await pool.getConnection()
        const appId = req.params.appId
        console.log(appId)
    
        try{ 
            const results = await conn.query(SQL_GET_BY_ID, [appId])
            const recs = results[0][0]
            console.log(recs.app_id)
    
            res.status(200)
            res.type('text/html')
            console.log("before render")
            res.render('record', {
                name: recs.name,
                id: recs.app_id
            })
        }catch(e) {
            console.log(e)
        } finally {
            conn.release()
        }
    })
    
    router.get("/search", async(req,res)=> {
        const offset = parseInt(req.query['offset']) || 0
        const q = req.query.q
        const limit = 10
        //acquire connection from the pool
        const conn= await pool.getConnection()
    
        console.log(offset)
        
    
        try{
            //perform the query 
            // const result = await conn.query(SQL_FIND_BY_NAME, [`%${searched}%`, 10])
            // const recs = result[0]
            //destructuring
            const [recs, _ ] = await conn.query(SQL_FIND_BY_NAME, [`%${q}%`, limit, offset])
            //determine pagination number
            res.status(200)
            res.type("text/html")
            res.render("index", {
            recs,
            q,
            prevOffset: Math.max(0, offset - limit),
            nextOffset: offset + limit
    
    
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
    return (router)
}

module.exports = r