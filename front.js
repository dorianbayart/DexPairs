'use strict'


import http from 'http'
import os from 'os'
import path from 'path'
import express from 'express'
import expressWs from 'express-ws'
import compression from 'compression'
import fetch from 'node-fetch'
import { promises as fs } from 'fs'
import { readFileSync } from 'fs'
import rateLimit from 'express-rate-limit'
import { MongoClient } from 'mongodb'



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
const dir_home = os.homedir()

/*
*
* Mongo Configuration
*
*/
const MONGO_URL = 'mongodb://localhost:27017'
const MONGO_CLIENT = new MongoClient(MONGO_URL)
const DN_NAME = 'DexPairs'
let collections = {}


// Pancake data - BSC
let top_tokens = {}

// Uniswap data - Ethereum
let uniswap_list = {}
let uniswap_top = {}
let uniswap_data = {}

// Quickswap data - Polygon/Matic
let quickswap_list = {}
let quickswap_top = {}
let quickswap_data = {}

// Spiritswap data - Fantom/Opera
let spiritswap_list = {}
let spiritswap_top = {}
let spiritswap_data = {}


let statistics = {
	latests: [],
	latests_nb: 250,
}



// Program - Pancake
async function launch() {
	// loop
	setTimeout(launch, getTimer())

	await fetch(BACKEND_URL + '/top/pancake')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			top_tokens = json
			console.log('Pancakeswap Top Json is Okay')
		} else {
			console.error('Pancakeswap Top Json error: '+ JSON.stringify(json))
		}
	})
}

// Program - Uniswap
async function launchUniswap() {

	// loop
	setTimeout(launchUniswap, getTimer())

	await fetch(BACKEND_URL + '/list/uniswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			uniswap_list = json
			console.log('Uniswap List Json is Okay')
		} else {
			console.error('Uniswap List Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/top/uniswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			uniswap_top = json
			console.log('Uniswap Top Json is Okay')
		} else {
			console.error('Uniswap Top Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/simple/uniswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			uniswap_data = json
			console.log('Uniswap Simple Json is Okay')
		} else {
			console.error('Uniswap Simple Json error: '+ JSON.stringify(json))
		}
	})
}

// Program - Quickswap
async function launchQuickswap() {
	// loop
	setTimeout(launchQuickswap, getTimer())

	await fetch(BACKEND_URL + '/list/quickswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			quickswap_list = json
			console.log('Quickswap List Json is Okay')
		} else {
			console.error('Quickswap List Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/top/quickswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			quickswap_top = json
			console.log('Quickswap Top Json is Okay')
		} else {
			console.error('Quickswap Top Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/simple/quickswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			quickswap_data = json
			console.log('Quickswap Simple Json is Okay')
		} else {
			console.error('Quickswap Simple Json error: '+ JSON.stringify(json))
		}
	})
}

// Program - Spiritswap
async function launchSpiritswap() {
	// loop
	setTimeout(launchSpiritswap, getTimer())

	await fetch(BACKEND_URL + '/list/spiritswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			spiritswap_list = json
			console.log('Spiritswap List Json is Okay')
		} else {
			console.error('Spiritswap List Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/top/spiritswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			spiritswap_top = json
			console.log('Spiritswap Top Json is Okay')
		} else {
			console.error('Spiritswap Top Json error: '+ JSON.stringify(json))
		}
	})

	await fetch(BACKEND_URL + '/simple/spiritswap')
	.then(res => res.json())
	.then(json => {
		if(Object.keys(json).length > 0) {
			spiritswap_data = json
			console.log('Spiritswap Simple Json is Okay')
		} else {
			console.error('Spiritswap Simple Json error: '+ JSON.stringify(json))
		}
	})
}





// Prepare Mongo collections
async function prepareCollections() {
	if(MONGO_CLIENT) {
		await MONGO_CLIENT.close()
	}
	await MONGO_CLIENT.connect()
	const db = MONGO_CLIENT.db(DN_NAME)
	collections.coingecko = db.collection('coingecko')
	collections.bnbChainPancakeSwapSimple = db.collection('bnb-chain_pancakeswap_simple')
	collections.bnbChainPancakeSwapList = db.collection('bnb-chain_pancakeswap_list')
	collections.gnosisSimple = db.collection('gnosis_simple')
	collections.gnosisList = db.collection('gnosis_list')
	console.log(collections)

	setTimeout(prepareCollections, 60 * 60 * 1000)
}




/* MAIN */
setTimeout(function(){ launchUniswap() }, 5000)
setTimeout(function(){ launchQuickswap() }, 6000)
setTimeout(function(){ launchSpiritswap() }, 7000)
setTimeout(function(){ launch() }, 3000)

setTimeout(prepareCollections, 750)



const limiter = rateLimit({
	windowMs: 10*1000, // 10 seconds
	max: 75
})


/* server */
const port = process.env.PORT || 3001
const app = express()
app.use(compression())
app.use(limiter)

app.get('/', (req, res) => res.sendFile('/index.html', { root: '.' }))
app.get('/charts', (req, res) => res.sendFile('/charts.html', { root: '.' }))
app.get('/wallet', (req, res) => res.sendFile('/wallet.html', { root: '.' }))
app.get('/news', (req, res) => res.sendFile('/news.html', { root: '.' }))
app.get('/statistics', (req, res) => res.sendFile('/statistics.html', { root: '.' }))
app.get('/donate', (req, res) => res.sendFile('/donate.html', { root: '.' }))
app.get('/feed.atom', (req, res) => res.sendFile('/feed.atom', { root: '.' }))
app.get('/service-worker.js', (req, res) => res.sendFile('/service-worker.js', { root: '.' }))
app.use('/img', express.static('img'))
app.use('/news/', express.static('news/'))
app.use('/public', express.static('public'))

app.get('/beta/', (req, res) => res.sendFile('/beta/index.html', { root: '.' }))
app.get('/beta/charts', (req, res) => res.sendFile('/beta/charts.html', { root: '.' }))
app.get('/beta/wallet', (req, res) => res.sendFile('/beta/wallet.html', { root: '.' }))
app.get('/beta/news', (req, res) => res.sendFile('/beta/news.html', { root: '.' }))
app.get('/beta/feed.atom', (req, res) => res.sendFile('/beta/feed.atom', { root: '.' }))
app.use('/beta/public', express.static('beta/public'))

// Coingecko URL
app.get('/coingecko/:blockchain/:token', async (req, res) => {
	const query = {
		$and: [
			{ platforms: { $regex : req.params.blockchain + '-' + req.params.token.toLowerCase() } },
			{ market_cap: { $ne: false } }
		]
	}
	res.json(await collections.coingecko.findOne(query))
})

// Pancake URLs
app.get('/pancake/list', async (req, res) => {
	const data = await collections.bnbChainPancakeSwapList.findOne({id: 'list'})
	res.json(data.list)
})
app.get('/pancake/top', (req, res) => res.json(top_tokens))
app.get('/pancake/simple', async (req, res) => {
	const data = await collections.bnbChainPancakeSwapSimple.find({}).toArray()
	res.json(mapFromDbToJson(data))
})
app.get('/pancake/charts/:token', async (req, res) => {
	const data = await readAndFilterFile('pancake-charts.json', req.params.token)
	res.json(data)
})
app.get('/pancake/charts/:token/:base', async (req, res) => {
	const data = await readAndFilterFile('pancake-charts.json', req.params.token, req.params.base)
	res.json(data)
})

// Uniswap URLs - Default
app.get('(/uniswap)?/token/:token', (req, res) => {
	if(
		Object.keys(uniswap_data).includes(req.params.token) ||
		Object.keys(uniswap_data).findIndex(address => uniswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile('/index.html', { root: '.' })
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('(/uniswap)?/list', (req, res) => res.json(listFilter(uniswap_list, uniswap_data)))
app.get('(/uniswap)?/top', (req, res) => res.json(uniswap_top))
app.get('(/uniswap)?/simple', (req, res) => res.json(listFilter(uniswap_data, uniswap_data)))
app.get('(/uniswap)?/charts/:token', async (req, res) => {
	const data = await readAndFilterFile('uniswap-charts.json', req.params.token)
	res.json(data)
})
app.get('(/uniswap)?/charts/:token/:base', async (req, res) => {
	const data = await readAndFilterFile('uniswap-charts.json', req.params.token, req.params.base)
	res.json(data)
})

// Quickswap URLs
app.get('/quickswap/token/:token', (req, res) => {
	if(
		Object.keys(quickswap_data).includes(req.params.token) ||
		Object.keys(quickswap_data).findIndex(address => quickswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile('/index.html', { root: '.' })
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/quickswap/list', (req, res) => res.json(listFilter(quickswap_list, quickswap_data)))
app.get('/quickswap/top', (req, res) => res.json(quickswap_top))
app.get('/quickswap/simple', (req, res) => res.json(listFilter(quickswap_data, quickswap_data)))
app.get('/quickswap/charts/:token', async (req, res) => {
	const data = await readAndFilterFile('quickswap-charts.json', req.params.token)
	res.json(data)
})
app.get('/quickswap/charts/:token/:base', async (req, res) => {
	const data = await readAndFilterFile('quickswap-charts.json', req.params.token, req.params.base)
	res.json(data)
})

// Spiritswap URLs
app.get('/spiritswap/token/:token', (req, res) => {
	if(
		Object.keys(spiritswap_data).includes(req.params.token) ||
		Object.keys(spiritswap_data).findIndex(address => spiritswap_data[address].s === req.params.token) !== -1
	) {
		res.sendFile('/index.html', { root: '.' })
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})

app.get('/spiritswap/list', (req, res) => res.json(listFilter(spiritswap_list, spiritswap_data)))
app.get('/spiritswap/top', (req, res) => res.json(spiritswap_top))
app.get('/spiritswap/simple', (req, res) => res.json(listFilter(spiritswap_data, spiritswap_data)))
app.get('/spiritswap/charts/:token', async (req, res) => {
	const data = await readAndFilterFile('spiritswap-charts.json', req.params.token)
	res.json(data)
})
app.get('/spiritswap/charts/:token/:base', async (req, res) => {
	const data = await readAndFilterFile('spiritswap-charts.json', req.params.token, req.params.base)
	res.json(data)
})

// Honeyswap URLs
app.get('/honeyswap/list', async (req, res) => {
	const data = await collections.gnosisList.findOne({id: 'list'})
	res.json(data.list)
})
app.get('/honeyswap/top', (req, res) => {
	res.header('Content-Type','application/json')
	res.sendFile(path.join(dir_home, 'honeyswap-top.json'))
})
app.get('/honeyswap/simple', async (req, res) => {
	const data = await collections.gnosisSimple.find({}).toArray()
	res.json(mapFromDbToJson(data))
})
app.get('/honeyswap/charts/:token', async (req, res) => {
	const data = await readAndFilterFile('honeyswap-charts.json', req.params.token)
	res.json(data)
})
app.get('/honeyswap/charts/:token/:base', async (req, res) => {
	const data = await readAndFilterFile('honeyswap-charts.json', req.params.token, req.params.base)
	res.json(data)
})

const server = app.listen(port, () => console.log(`Frontend start at ${port}`))

http.createServer((req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.end('Hello World')
})


const readAndFilterFile = async (filename, token, base) => {
	const file = readFileSync(path.join(dir_home, filename), 'utf8')
	const json = JSON.parse(file.toString())
	let result = {}
	if(token && base) {
		result[token] = json[token]
		result[base] = json[base]
	} else {
		result = json[token]
	}
	return result
}

/**
* WebSocket Server
*/
expressWs(app, server)
app.ws('/ws', async function(ws, req) {
	ws.on('message', async function(data) {
		const msg = JSON.parse(data)
		console.log(msg)
		statistics.latests.push(msg)
		statistics.latests = statistics.latests.slice(-statistics.latests_nb)
		switch (msg.type) {
			case 'connection':
				console.log('client connected to WSS')
				ws.send(JSON.stringify({
					type: 'connection',
					data: true
				}))
			break
			case 'statistics':
				console.log('statistics asked')
				ws.send(JSON.stringify({
					type: 'statistics',
					data: statistics
				}))
			break
			default:
			console.log('other')
		}
	})
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


// useful map - Simple data from DB to Json
function mapFromDbToJson(data) {
	const result = {}
	data.filter(token => token.p > 0).forEach((token) => {
		result[token.id] = {
			n: token.n,
			s: token.s,
			p: token.p,
			t: token.t
		}
	})
	return result
}

// useful Math.random timer
function getTimer() {
	if(process.env.NODE_ENV === 'production') {
		// between 15 and 45 seconds in Production Mode
		return Math.round((30*Math.random() + 15)*1000)
	}
	// between 60 and 180 seconds in Dev Mode
	return Math.round((120*Math.random() + 60)*1000)
}
