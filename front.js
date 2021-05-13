const http = require('http')
const path = require('path')
const express = require('express')
const fetch = require('node-fetch')



/********************************

          DexPairs.xyz

*********************************/
/*        Dorian Bayart         */
/*             2021             */
/********************************/


/*
* Frontend server
*
* Fetch JSON from backend
* Expose some public URLs
*/

const backend = 'http://localhost:3000'


let tokens_list = []
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}





// Program
function launch() {
  fetch(backend + '/list')
    .then(res => res.json())
    .then(json => tokens_list = json.tokens)

  fetch(backend + '/top')
    .then(res => res.json())
    .then(json => top_tokens = json)

  fetch(backend + '/simple')
    .then(res => res.json())
    .then(json => tokens_data = json)

  fetch(backend + '/charts')
    .then(res => res.json())
    .then(json => tokens_charts = json)

  // loop
  if(Object.keys(top_tokens).length < 1) {
    // only used at startup
    setTimeout(function(){ launch() }, 1000);
  } else {
    setTimeout(function(){ launch() }, 20000);
  }
}




/* MAIN */
launch()




/* server */
const port = 3001
const app = express()

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/index.html')))
app.get('/list', (req, res) => res.json({tokens: tokens_list}))
app.get('/top', (req, res) => res.json(top_tokens))
app.get('/simple', (req, res) => res.json(tokens_data))
app.get('/charts/:token', (req, res) => {
  console.log(req.params.token)
  res.json(tokens_charts[req.params.token])
})
app.get('/charts/:token/:base', (req, res) => {
  let pair = {}
  pair[req.params.token] = tokens_charts[req.params.token]
  pair[req.params.base] = tokens_charts[req.params.base]
  res.json(pair)
})

app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, '/public/script.js')))
app.get('/design.css', (req, res) => res.sendFile(path.join(__dirname, '/public/design.css')))

app.listen(port, () => console.log(`Frontend start at ${port}`))

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.end('Hello World')
})
