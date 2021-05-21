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


// Pancake data
let tokens_list = {}
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}

// Uniswap data
let uniswap_list = {}
let uniswap_top = {}
let uniswap_data = {}
let uniswap_charts = {}




// Program - Pancake
function launch() {
  fetch(backend + '/list/pancake')
  .then(res => res.json())
  .then(json => tokens_list = json)

  fetch(backend + '/top/pancake')
  .then(res => res.json())
  .then(json => top_tokens = json)

  fetch(backend + '/simple/pancake')
  .then(res => res.json())
  .then(json => tokens_data = json)

  fetch(backend + '/charts/pancake')
  .then(res => res.json())
  .then(json => tokens_charts = json)

  // loop
  if(Object.keys(top_tokens).length < 1) {
    // only used at startup
    setTimeout(function(){ launch() }, 1000);
  } else {
    setTimeout(function(){ launch() }, 19000);
  }
}

// Program - Uniswap
function launchUniswap() {
  fetch(backend + '/list/uniswap')
  .then(res => res.json())
  .then(json => uniswap_list = json)

  fetch(backend + '/top/uniswap')
  .then(res => res.json())
  .then(json => uniswap_top = json)

  fetch(backend + '/simple/uniswap')
  .then(res => res.json())
  .then(json => uniswap_data = json)

  fetch(backend + '/charts/uniswap')
  .then(res => res.json())
  .then(json => uniswap_charts = json)

  // loop
  if(Object.keys(uniswap_top).length < 1) {
    // only used at startup
    setTimeout(function(){ launchUniswap() }, 1000);
  } else {
    setTimeout(function(){ launchUniswap() }, 19000);
  }
}




/* MAIN */
launch()
launchUniswap()




/* server */
const port = process.env.PORT || 3001
const app = express()

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/index.html')))
app.get('/script.js', (req, res) => res.sendFile(path.join(__dirname, '/public/script.js')))
app.get('/design.css', (req, res) => res.sendFile(path.join(__dirname, '/public/design.css')))
app.get('/responsive.css', (req, res) => res.sendFile(path.join(__dirname, '/public/responsive.css')))

// Pancake URLs
app.get('/pancake/token/:token', (req, res) => {
  if(
    Object.keys(tokens_data).includes(req.params.token) ||
    Object.keys(tokens_data).findIndex(address => tokens_data[address].s === req.params.token) !== -1
  ) {
    res.sendFile(path.join(__dirname, '/public/index.html'))
  } else {
    // TODO Improve error => redirect to homepage
    res.writeHead(400, {'Content-Type': 'text/html'})
    res.end('This token does not exist !')
  }
})

app.get('/pancake/list', (req, res) => res.json(tokens_list))
app.get('/pancake/top', (req, res) => res.json(top_tokens))
app.get('/pancake/simple', (req, res) => res.json(tokens_data))
app.get('/pancake/charts/:token', (req, res) => {
  res.json(tokens_charts[req.params.token])
})
app.get('/pancake/charts/:token/:base', (req, res) => {
  let pair = {}
  pair[req.params.token] = tokens_charts[req.params.token]
  pair[req.params.base] = tokens_charts[req.params.base]
  res.json(pair)
})

// Uniswap URLs - Default
app.get('(/uniswap)?/token/:token', (req, res) => {
  if(
    Object.keys(uniswap_data).includes(req.params.token) ||
    Object.keys(uniswap_data).findIndex(address => uniswap_data[address].s === req.params.token) !== -1
  ) {
    res.sendFile(path.join(__dirname, '/public/index.html'))
  } else {
    // TODO Improve error => redirect to homepage
    res.writeHead(400, {'Content-Type': 'text/html'})
    res.end('This token does not exist !')
  }
})

app.get('(/uniswap)?/list', (req, res) => res.json(uniswap_list))
app.get('(/uniswap)?/top', (req, res) => res.json(uniswap_top))
app.get('(/uniswap)?/simple', (req, res) => res.json(uniswap_data))
app.get('(/uniswap)?/charts/:token', (req, res) => {
  res.json(uniswap_charts[req.params.token])
})
app.get('(/uniswap)?/charts/:token/:base', (req, res) => {
  let pair = {}
  pair[req.params.token] = uniswap_charts[req.params.token]
  pair[req.params.base] = uniswap_charts[req.params.base]
  res.json(pair)
})



app.listen(port, () => console.log(`Frontend start at ${port}`))

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.end('Hello World')
})
