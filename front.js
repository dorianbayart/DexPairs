const http = require('http')
const path = require('path')
const express = require('express')
const compression = require('compression')
const fetch = require('node-fetch')
const rateLimit = require('express-rate-limit')



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

const BACKEND_URL = 'http://127.0.0.1:3000'

// Pancake data - BSC
let tokens_list = {}
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}

// Uniswap data - Ethereum
let uniswap_list = {}
let uniswap_top = {}
let uniswap_data = {}
let uniswap_charts = {}

// Quickswap data - Polygon/Matic
let quickswap_list = {}
let quickswap_top = {}
let quickswap_data = {}
let quickswap_charts = {}

// Spiritswap data - Fantom/Opera
let spiritswap_list = {}
let spiritswap_top = {}
let spiritswap_data = {}
let spiritswap_charts = {}

// Honeyswap data - xDai
let honeyswap_list = {}
let honeyswap_top = {}
let honeyswap_data = {}
let honeyswap_charts = {}




// Program - Pancake
async function launch() {
	// loop
	setTimeout(launch, getTimer())

	await fetch(BACKEND_URL + '/list/pancake')
		.then(res => res.json())
		.then(json => tokens_list = json)

	await fetch(BACKEND_URL + '/top/pancake')
		.then(res => res.json())
		.then(json => top_tokens = json)

	await fetch(BACKEND_URL + '/simple/pancake')
		.then(res => res.json())
		.then(json => tokens_data = json)

	await fetch(BACKEND_URL + '/charts/pancake')
		.then(res => res.json())
		.then(json => tokens_charts = json)
}

// Program - Uniswap
async function launchUniswap() {

	// loop
	setTimeout(launchUniswap, getTimer())

	await fetch(BACKEND_URL + '/list/uniswap')
		.then(res => res.json())
		.then(json => uniswap_list = json)

	await fetch(BACKEND_URL + '/top/uniswap')
		.then(res => res.json())
		.then(json => uniswap_top = json)

	await fetch(BACKEND_URL + '/simple/uniswap')
		.then(res => res.json())
		.then(json => uniswap_data = json)

	await fetch(BACKEND_URL + '/charts/uniswap')
		.then(res => res.json())
		.then(json => uniswap_charts = json)

}

// Program - Quickswap
async function launchQuickswap() {
	// loop
	setTimeout(launchQuickswap, getTimer())

	await fetch(BACKEND_URL + '/list/quickswap')
		.then(res => res.json())
		.then(json => quickswap_list = json)

	await fetch(BACKEND_URL + '/top/quickswap')
		.then(res => res.json())
		.then(json => quickswap_top = json)

	await fetch(BACKEND_URL + '/simple/quickswap')
		.then(res => res.json())
		.then(json => quickswap_data = json)

	await fetch(BACKEND_URL + '/charts/quickswap')
		.then(res => res.json())
		.then(json => quickswap_charts = json)
}

// Program - Spiritswap
async function launchSpiritswap() {
	// loop
	setTimeout(launchSpiritswap, getTimer())

	await fetch(BACKEND_URL + '/list/spiritswap')
		.then(res => res.json())
		.then(json => spiritswap_list = json)

	await fetch(BACKEND_URL + '/top/spiritswap')
		.then(res => res.json())
		.then(json => spiritswap_top = json)

	await fetch(BACKEND_URL + '/simple/spiritswap')
		.then(res => res.json())
		.then(json => spiritswap_data = json)

	await fetch(BACKEND_URL + '/charts/spiritswap')
		.then(res => res.json())
		.then(json => spiritswap_charts = json)
}

// Program - Honeyswap
async function launchHoneyswap() {
	// loop
	setTimeout(launchHoneyswap, getTimer())

	await fetch(BACKEND_URL + '/list/honeyswap')
		.then(res => res.json())
		.then(json => honeyswap_list = json)

	await fetch(BACKEND_URL + '/top/honeyswap')
		.then(res => res.json())
		.then(json => honeyswap_top = json)

	await fetch(BACKEND_URL + '/simple/honeyswap')
		.then(res => res.json())
		.then(json => honeyswap_data = json)

	await fetch(BACKEND_URL + '/charts/honeyswap')
		.then(res => res.json())
		.then(json => honeyswap_charts = json)
}




/* MAIN */
setTimeout(function(){ launchUniswap() }, 5000)
setTimeout(function(){ launchQuickswap() }, 6000)
setTimeout(function(){ launchSpiritswap() }, 7000)
setTimeout(function(){ launchHoneyswap() }, 8000)
setTimeout(function(){ launch() }, 9000)





const limiter = new rateLimit({
	windowMs: 10*1000, // 10 seconds
	max: 40
})


/* server */
const port = process.env.PORT || 3001
const app = express()
app.use(compression())
app.use(limiter)

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/index.html')))
app.get('/charts', (req, res) => res.sendFile(path.join(__dirname, '/charts.html')))
app.get('/wallet', (req, res) => res.sendFile(path.join(__dirname, '/wallet.html')))
app.get('/news', (req, res) => res.sendFile(path.join(__dirname, '/news.html')))
app.get('/feed.atom', (req, res) => res.sendFile(path.join(__dirname, '/feed.atom')))
app.use('/img', express.static('img'))
app.use('/public', express.static('public'))

app.get('/beta/', (req, res) => res.sendFile(path.join(__dirname, '/beta/index.html')))
app.get('/beta/charts', (req, res) => res.sendFile(path.join(__dirname, '/beta/charts.html')))
app.get('/beta/wallet', (req, res) => res.sendFile(path.join(__dirname, '/beta/wallet.html')))
app.get('/beta/news', (req, res) => res.sendFile(path.join(__dirname, '/beta/news.html')))
app.get('/beta/feed.atom', (req, res) => res.sendFile(path.join(__dirname, '/beta/feed.atom')))
app.use('/beta/public', express.static('beta/public'))

// Pancake URLs
app.get('/pancake/token/:token', (req, res) => {
	if(
		Object.keys(tokens_data).includes(req.params.token) ||
    Object.keys(tokens_data).findIndex(address => tokens_data[address].s === req.params.token) !== -1
	) {
		res.sendFile(path.join(__dirname, '/index.html'))
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/pancake/list', (req, res) => res.json(listFilter(tokens_list, tokens_data)))
app.get('/pancake/top', (req, res) => res.json(top_tokens))
app.get('/pancake/simple', (req, res) => res.json(listFilter(tokens_data, tokens_data)))
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
		res.sendFile(path.join(__dirname, '/index.html'))
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('(/uniswap)?/list', (req, res) => res.json(listFilter(uniswap_list, uniswap_data)))
app.get('(/uniswap)?/top', (req, res) => res.json(uniswap_top))
app.get('(/uniswap)?/simple', (req, res) => res.json(listFilter(uniswap_data, uniswap_data)))
app.get('(/uniswap)?/charts/:token', (req, res) => {
	res.json(uniswap_charts[req.params.token])
})
app.get('(/uniswap)?/charts/:token/:base', (req, res) => {
	let pair = {}
	pair[req.params.token] = uniswap_charts[req.params.token]
	pair[req.params.base] = uniswap_charts[req.params.base]
	res.json(pair)
})

// Quickswap URLs
app.get('/quickswap/token/:token', (req, res) => {
	if(
		Object.keys(quickswap_data).includes(req.params.token) ||
    Object.keys(quickswap_data).findIndex(address => quickswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile(path.join(__dirname, '/index.html'))
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/quickswap/list', (req, res) => res.json(listFilter(quickswap_list, quickswap_data)))
app.get('/quickswap/top', (req, res) => res.json(quickswap_top))
app.get('/quickswap/simple', (req, res) => res.json(listFilter(quickswap_data, quickswap_data)))
app.get('/quickswap/charts/:token', (req, res) => {
	res.json(quickswap_charts[req.params.token])
})
app.get('/quickswap/charts/:token/:base', (req, res) => {
	let pair = {}
	pair[req.params.token] = quickswap_charts[req.params.token]
	pair[req.params.base] = quickswap_charts[req.params.base]
	res.json(pair)
})

// Spiritswap URLs
app.get('/spiritswap/token/:token', (req, res) => {
	if(
		Object.keys(spiritswap_data).includes(req.params.token) ||
    Object.keys(spiritswap_data).findIndex(address => spiritswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile(path.join(__dirname, '/index.html'))
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/spiritswap/list', (req, res) => res.json(listFilter(spiritswap_list, spiritswap_data)))
app.get('/spiritswap/top', (req, res) => res.json(spiritswap_top))
app.get('/spiritswap/simple', (req, res) => res.json(listFilter(spiritswap_data, spiritswap_data)))
app.get('/spiritswap/charts/:token', (req, res) => {
	res.json(spiritswap_charts[req.params.token])
})
app.get('/spiritswap/charts/:token/:base', (req, res) => {
	let pair = {}
	pair[req.params.token] = spiritswap_charts[req.params.token]
	pair[req.params.base] = spiritswap_charts[req.params.base]
	res.json(pair)
})

// Honeyswap URLs
app.get('/honeyswap/token/:token', (req, res) => {
	if(
		Object.keys(honeyswap_data).includes(req.params.token) ||
    Object.keys(honeyswap_data).findIndex(address => honeyswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile(path.join(__dirname, '/index.html'))
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/honeyswap/list', (req, res) => res.json(listFilter(honeyswap_list, honeyswap_data)))
app.get('/honeyswap/top', (req, res) => res.json(honeyswap_top))
app.get('/honeyswap/simple', (req, res) => res.json(listFilter(honeyswap_data, honeyswap_data)))
app.get('/honeyswap/charts/:token', (req, res) => {
	res.json(honeyswap_charts[req.params.token])
})
app.get('/honeyswap/charts/:token/:base', (req, res) => {
	let pair = {}
	pair[req.params.token] = honeyswap_charts[req.params.token]
	pair[req.params.base] = honeyswap_charts[req.params.base]
	res.json(pair)
})

app.listen(port, () => console.log(`Frontend start at ${port}`))

http.createServer((req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.end('Hello World')
})


// useful filtering - filter all tokens with price = 0
function listFilter(list, listWithPrices) {
	let filtered_list = {}
	Object.keys(list).forEach(function (address) {
		if(listWithPrices[address]/* && listWithPrices[address].p !== 0*/) {
			filtered_list[address] = list[address]
		}
	})
	return filtered_list
}

// useful Math.random timer - between 12 and 30 seconds
function getTimer() {
	return Math.round((18*Math.random() + 12)*1000)
}
