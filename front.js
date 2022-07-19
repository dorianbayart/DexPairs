'use strict'


import http from 'http'
import os from 'os'
import path from 'path'
import express from 'express'
import compression from 'compression'
import fetch from 'node-fetch'
import { promises as fs } from 'fs'
import rateLimit from 'express-rate-limit'



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


// CoinGecko
let coingecko = []



// Program - Pancake
async function launch() {
	// loop
	setTimeout(launch, getTimer())

	await fetch(BACKEND_URL + '/list/pancake')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				tokens_list = json
				console.log('Pancakeswap List Json is Okay')
			} else {
				console.error('Pancakeswap List Json error: '+ JSON.stringify(json))
			}
		})

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

	await fetch(BACKEND_URL + '/simple/pancake')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				tokens_data = json
				console.log('Pancakeswap Simple Json is Okay')
			} else {
				console.error('Pancakeswap Simple Json error: '+ JSON.stringify(json))
			}
		})

	await fetch(BACKEND_URL + '/charts/pancake')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				tokens_charts = json
				console.log('Pancakeswap Charts Json is Okay')
			} else {
				console.error('Pancakeswap Charts Json error: '+ JSON.stringify(json))
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

	await fetch(BACKEND_URL + '/charts/uniswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				uniswap_charts = json
				console.log('Uniswap Charts Json is Okay')
			} else {
				console.error('Uniswap Charts Json error: '+ JSON.stringify(json))
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

	await fetch(BACKEND_URL + '/charts/quickswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				quickswap_charts = json
				console.log('Quickswap Charts Json is Okay')
			} else {
				console.error('Quickswap Charts Json error: '+ JSON.stringify(json))
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

	await fetch(BACKEND_URL + '/charts/spiritswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				spiritswap_charts = json
				console.log('Spiritswap Charts Json is Okay')
			} else {
				console.error('Spiritswap Charts Json error: '+ JSON.stringify(json))
			}
		})
}

// Program - Honeyswap
async function launchHoneyswap() {
	// loop
	setTimeout(launchHoneyswap, getTimer())

	await fetch(BACKEND_URL + '/list/honeyswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				honeyswap_list = json
				console.log('Honeyswap List Json is Okay')
			} else {
				console.error('Honeyswap List Json error: '+ JSON.stringify(json))
			}
		})

	await fetch(BACKEND_URL + '/top/honeyswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				honeyswap_top = json
				console.log('Honeyswap Top Json is Okay')
			} else {
				console.error('Honeyswap Top Json error: '+ JSON.stringify(json))
			}
		})

	await fetch(BACKEND_URL + '/simple/honeyswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				honeyswap_data = json
				console.log('Honeyswap Simple Json is Okay')
			} else {
				console.error('Honeyswap Simple Json error: '+ JSON.stringify(json))
			}
		})

	await fetch(BACKEND_URL + '/charts/honeyswap')
		.then(res => res.json())
		.then(json => {
			if(Object.keys(json).length > 0) {
				honeyswap_charts = json
				console.log('Honeyswap Charts Json is Okay')
			} else {
				console.error('Honeyswap Charts Json error: '+ JSON.stringify(json))
			}
		})
}




// Program - CoinGecko
async function launchCoingecko() {
	// loop
	setTimeout(launchCoingecko, getTimer())

	try {
		const file = await fs.readFile(path.join(dir_home, 'coingecko.json'), 'utf8')
		coingecko = JSON.parse(file)
		coingecko = coingecko.filter((token) => token.market_cap > 0 && token.market_cap_rank && token.platforms)
	} catch (err) {
		console.error(err)
	}
}




/* MAIN */
setTimeout(function(){ launchUniswap() }, 5000)
setTimeout(function(){ launchQuickswap() }, 6000)
setTimeout(function(){ launchSpiritswap() }, 7000)
setTimeout(function(){ launchHoneyswap() }, 8000)
setTimeout(function(){ launch() }, 3000)

setTimeout(launchCoingecko, 3000)



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
app.get('/donate', (req, res) => res.sendFile('/donate.html', { root: '.' }))
app.get('/feed.atom', (req, res) => res.sendFile('/feed.atom', { root: '.' }))
app.use('/img', express.static('img'))
app.use('/public', express.static('public'))
app.use('/news/', express.static('news/'))

app.get('/beta/', (req, res) => res.sendFile('/beta/index.html', { root: '.' }))
app.get('/beta/charts', (req, res) => res.sendFile('/beta/charts.html', { root: '.' }))
app.get('/beta/wallet', (req, res) => res.sendFile('/beta/wallet.html', { root: '.' }))
app.get('/beta/news', (req, res) => res.sendFile('/beta/news.html', { root: '.' }))
app.get('/beta/feed.atom', (req, res) => res.sendFile('/beta/feed.atom', { root: '.' }))
app.use('/beta/public', express.static('beta/public'))

// Coingecko URL
app.get('/coingecko/:blockchain/:token', (req, res) => {
	res.json(coingecko.find((token) => token.platforms[req.params.blockchain] && token.platforms[req.params.blockchain].toLowerCase() === req.params.token.toLowerCase()))
})

// Pancake URLs
app.get('/pancake/token/:token', (req, res) => {
	if(
		Object.keys(tokens_data).includes(req.params.token) ||
    Object.keys(tokens_data).findIndex(address => tokens_data[address].s === req.params.token) !== -1
	) {
		res.sendFile('/index.html', { root: '.' })
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
		res.sendFile('/index.html', { root: '.' })
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

// useful Math.random timer
function getTimer() {
	if(process.env.NODE_ENV === 'production') {
		// between 15 and 30 seconds in Production Mode
		return Math.round((15*Math.random() + 15)*1000)
	}
	// between 60 and 180 seconds in Dev Mode
	return Math.round((120*Math.random() + 60)*1000)
}
