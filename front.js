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
import { createClient } from 'redis'



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


/* Redis */
const redis = createClient({
	url: 'redis://localhost:6666'
})



let statistics = {
	latests: [],
	latests_nb: 250,
}


/* Const used for charts */
const INTERVAL_15M = '15m'
const INTERVAL_4H = '4h'
const INTERVAL_1D = '1d'
const INTERVAL_1W = '1w'






// Prepare Mongo collections
async function prepareCollections() {
	// if(MONGO_CLIENT) {
	// 	await MONGO_CLIENT.close()
	// }
	if(!MONGO_CLIENT) {
		await MONGO_CLIENT.connect()
	}

	const db = MONGO_CLIENT.db(DN_NAME)
	collections.coingecko = db.collection('coingecko')
	//collections.bnbChainPancakeSwapSimple = db.collection('bnb-chain_pancakeswap_simple')
	//collections.bnbChainPancakeSwapList = db.collection('bnb-chain_pancakeswap_list')
	//collections.gnosisSimple = db.collection('gnosis_simple')
	//collections.gnosisList = db.collection('gnosis_list')
	console.log(collections)

	setTimeout(prepareCollections, 60 * 60 * 1000)

	//await redis.quit()
	await redis.connect()

}




/* MAIN */

setTimeout(prepareCollections, 750)



const limiter = rateLimit({
	windowMs: 10*1000, // 10 seconds
	max: 50
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

// Uniswap URLs - Default
app.get('/:chain?/token/:token', async (req, res) => {
	const data = await redis.get(req.params.chain+':data')
	const parsed = JSON.parse(data)
	if(
		Object.keys(parsed).includes(req.params.token) ||
		Object.keys(parsed).findIndex(address => parsed[address].s === req.params.token) !== -1
	) {
		res.sendFile('/index.html', { root: '.' })
	} else {
		// TODO Improve error => redirect to homepage
		res.writeHead(400, {'Content-Type': 'text/html'})
		res.end('This token does not exist !')
	}
})
app.get('/:chain?/top', async (req, res) => {
	const data = await redis.get(req.params.chain+':top')
	res.json(JSON.parse(data))
})
app.get('/:chain?/simple', async (req, res) => {
	const data = await redis.get(req.params.chain+':data')
	res.json(JSON.parse(data))
})
app.get('/:chain?/charts/:token', async (req, res) => {
	const data = await buildChartsData(req.params.chain, req.query.interval, req.params.token)
	res.json(data)
})
app.get('/:chain?/charts/:token/:base', async (req, res) => {
	const data = await buildChartsData(req.params.chain, req.query.interval, req.params.token, req.params.base)
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

const buildChartsData = async (chain, interval, token, base) => {
	let chartTimeframe = 'c1'
	switch (interval) {
		case INTERVAL_15M:
			chartTimeframe = 'c1'
			break;
		case INTERVAL_4H:
			chartTimeframe = 'c2'
			break;
		case INTERVAL_1D:
			chartTimeframe = 'c3'
			break;
		case INTERVAL_1W:
			chartTimeframe = 'c4'
			break;
		default:
			chartTimeframe = 'c1'
	}
	let chart_str = await redis.get(`${chain}:${chartTimeframe}:${token}`)
	let chart = JSON.parse(chart_str)
	let result = {}
	if(chart) {
		result[token] = chart
	}
	if(base) {
		chart_str = await redis.get(`${chain}:${chartTimeframe}:${base}`)
		chart = JSON.parse(chart_str)
		if(chart) {
			result[base] = chart
		}
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
