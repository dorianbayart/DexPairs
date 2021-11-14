const http = require('http')
const os = require('os')
const path = require('path')
const express = require('express')
const fetch = require('node-fetch')
const { readFileSync, writeFile, writeFileSync } = require('fs')



/********************************

DexPairs.xyz

*********************************/
/*        Dorian Bayart         */
/*             2021             */
/********************************/


/*
* Backend Server
*
* Fetch data from APIs
* Structure data in JSON
* Store them as file
* Expose those files
*/


const dir_home = os.homedir()
console.log(dir_home)


const VOLUME_SIZE = 12
const REALTIME = 30000 // 30 seconds
const OFTEN = 900000 // 15 minutes
const HOURS = 14400000 // 4 hours
const DAY = 86400000 // 1 day
const WEEK = 604800000 // 1 week
const HISTORY_SIZE = 192
const HISTORY_SIZE_24H = 96 // 24h / 15min
const TOP_SIZE = 6


/* DexPairs */


// Pancake data - BinanceSmartChain
let tokens_list = {}
let top_tokens = {}
let tokens_data = {}
let tokens_charts = {}
let pancakeswap_volume = {}

// Quickswap data - Polygon/Matic
let quickswap_list = {}
let quickswap_top = {}
let quickswap_data = {}
let quickswap_charts = {}
let quickswap_volume = {}

// Spiritswap data - Fantom/Opera
let spiritswap_list = {}
let spiritswap_top = {}
let spiritswap_data = {}
let spiritswap_charts = {}
let spiritswap_volume = {}

// Honeyswap data - xDai
let honeyswap_list = {}
let honeyswap_top = {}
let honeyswap_data = {}
let honeyswap_charts = {}
let honeyswap_volume = {}



// Utils
async function get(url, query = null) {
	if(query) {
		return new Promise((resolve, reject) => {
			fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query })
			})
				.then((response) => response.json())
				.then(resolve)
				.catch(reject)
		})
	}
	return new Promise((resolve, reject) => {
		fetch(url)
			.then((response) => response.json())
			.then(resolve)
			.catch(reject)
	})
}


// Get Pancakeswap's top
const pancakeswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedBNB,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    bnbPrice
  }
}
`

// Use TheGraph API - https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2
async function getPancakeswapTopTokens() {
	return await get('https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2', pancakeswap_request)
}

// Get Uniswap v3 top
const uniswapV3_request = `
query
{
  tokens(first: 1000, orderBy: volumeUSD, orderDirection: desc, where: { volumeUSD_gt: "100" } ) {
    id
    name
    symbol
    derivedETH,
    volumeUSD
  }
  bundle(id: "1" ) {
    ethPriceUSD
  }
}
`

// Use TheGraph API - https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3
async function getUniswapV3TopTokens() {
	return await get('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', uniswapV3_request)
}

// Get Uniswap v2 top
const uniswapV2_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "100" } ) {
    id
    name
    symbol
    derivedETH,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/uniswap/uniswap-v2
async function getUniswapV2TopTokens() {
	return await get('https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2', uniswapV2_request)
}

// Get Quickswap's top
const quickswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedETH,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/legacy-explorer/subgraph/henrydapp/quickswap
async function getQuickswapTopTokens() {
	return await get('https://api.thegraph.com/subgraphs/name/henrydapp/quickswap', quickswap_request)
}

// Get Spiritswap's top
const spiritswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedFTM,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ftmPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/layer3org/spiritswap-analytics
async function getSpiritswapTopTokens() {
	return await get('https://api.thegraph.com/subgraphs/name/layer3org/spiritswap-analytics', spiritswap_request)
}

// Get Honeywap's top
const honeyswap_request = `
query
{
  tokens(first: 1000, orderBy: tradeVolumeUSD, orderDirection: desc, where: { totalLiquidity_gt: "10" } ) {
    id
    name
    symbol
    derivedETH,
    tradeVolumeUSD
  }
  bundle(id: "1" ) {
    ethPrice
  }
}
`

// Use TheGraph API - https://thegraph.com/explorer/subgraph/kirkins/honeyswap
async function getHoneyswapTopTokens() {
	return await get('https://api.thegraph.com/subgraphs/name/kirkins/honeyswap', honeyswap_request)
}




// Program - Pancake
async function launch() {
	// loop
	setTimeout(launch, REALTIME) // every few seconds

	let tokens_data_file = {}
	let tokens_charts_file = {}
	let pancakeswap_volume_file = {}

	try {
		tokens_data_file = readFileSync(path.join(dir_home, 'pancake-simple.json'), 'utf8')
		tokens_data = JSON.parse(tokens_data_file.toString())
		let pathFile = path.join(dir_home, 'save_pancake-simple.json')
		writeFileSync(pathFile, JSON.stringify( tokens_data ), 'utf8')
	} catch(error) {
		console.log('pancake-simple.json', error)
		tokens_data_file = readFileSync(path.join(dir_home, 'save_pancake-simple.json'), 'utf8')
		tokens_data = JSON.parse(tokens_data_file.toString())
	}

	try {
		tokens_charts_file = readFileSync(path.join(dir_home, 'pancake-charts.json'), 'utf8')
		tokens_charts = JSON.parse(tokens_charts_file.toString())
		let pathFile = path.join(dir_home, 'save_pancake-charts.json')
		writeFileSync(pathFile, JSON.stringify( tokens_charts ), 'utf8')
	} catch(error) {
		console.log('pancake-charts.json', error)
		tokens_charts_file = readFileSync(path.join(dir_home, 'save_pancake-charts.json'), 'utf8')
		tokens_charts = JSON.parse(tokens_charts_file.toString())
	}

	try {
		pancakeswap_volume_file = readFileSync(path.join(dir_home, 'pancake-volume.json'), 'utf8')
		pancakeswap_volume = JSON.parse(pancakeswap_volume_file.toString())
		let pathFile = path.join(dir_home, 'save_pancake-volume.json')
		writeFileSync(pathFile, JSON.stringify( pancakeswap_volume ), 'utf8')
	} catch(error) {
		console.log('pancake-volume.json', error)
		pancakeswap_volume_file = readFileSync(path.join(dir_home, 'save_pancake-volume.json'), 'utf8')
		pancakeswap_volume = JSON.parse(pancakeswap_volume_file.toString())
	}


	tokens_list = {}

	// get data from PancakeSwap
	let top = {}
	try {
		top = await getPancakeswapTopTokens()
	} catch(error) {
		console.log(error)
		return
	}


	const time = Date.now()
	const tokens = top.data ? top.data.tokens : []

	const bnb_price = top.data ? top.data.bundle.bnbPrice : 0
	if(bnb_price === 0) return

	tokens.forEach(token => {
		const address = token.id
		const symbol = token.symbol
		const name = token.name
		const price_BNB = token.derivedBNB
		const price = price_BNB * bnb_price
		const volumeUSD = token.tradeVolumeUSD

		// create tokens list
		tokens_list[address] = symbol


		// update tokens simple data
		tokens_data[address] = {
			s: symbol,
			n: name,
			p: price,
			t: time
		}

		// update tokens charts
		//
		if(tokens_charts[address]) {
			if(time - tokens_charts[address].chart_often[tokens_charts[address].chart_often.length-1]['t'] > OFTEN) {
				tokens_charts[address].chart_often.push({
					t: time,
					p: price
				})
				tokens_charts[address].chart_often = tokens_charts[address].chart_often.slice(-HISTORY_SIZE)
			}
		} else {
			tokens_charts[address] = {
				s: symbol,
				n: name,
				chart_often: [{
					t: time,
					p: price
				}]
			}
		}
		if(pancakeswap_volume[address]) {
			if(time - pancakeswap_volume[address][pancakeswap_volume[address].length-1]['t'] > OFTEN) {
				pancakeswap_volume[address].push({
					t: time,
					v: volumeUSD,
				})
				pancakeswap_volume[address] = pancakeswap_volume[address].slice(-VOLUME_SIZE)
			}
		} else {
			pancakeswap_volume[address] = [{
				t: time,
				v: volumeUSD,
			}]
		}
		if(tokens_charts[address].chart_4h) {
			if((time - tokens_charts[address].chart_4h[tokens_charts[address].chart_4h.length-1]['t']) > HOURS) {
				tokens_charts[address].chart_4h.push({
					t: time,
					p: price,
				})
				tokens_charts[address].chart_4h = tokens_charts[address].chart_4h.slice(-HISTORY_SIZE)
			}
		} else {
			tokens_charts[address].chart_4h = [{
				t: time,
				p: price
			}]
		}
		if(tokens_charts[address].chart_1d) {
			if((time - tokens_charts[address].chart_1d[tokens_charts[address].chart_1d.length-1]['t']) > DAY) {
				tokens_charts[address].chart_1d.push({
					t: time,
					p: price,
				})
				tokens_charts[address].chart_1d = tokens_charts[address].chart_1d.slice(-HISTORY_SIZE)
			}
		} else {
			tokens_charts[address].chart_1d = [{
				t: time,
				p: price
			}]
		}
		if(tokens_charts[address].chart_1w) {
			if((time - tokens_charts[address].chart_1w[tokens_charts[address].chart_1w.length-1]['t']) > WEEK) {
				tokens_charts[address].chart_1w.push({
					t: time,
					p: price,
				})
				tokens_charts[address].chart_1w = tokens_charts[address].chart_1w.slice(-HISTORY_SIZE)
			}
		} else {
			tokens_charts[address].chart_1w = [{
				t: time,
				p: price
			}]
		}
	})


	// Sort tokens depending on volume
	tokens_list = sortTokensByVolume(tokens_list, pancakeswap_volume)

	// build Top 10 list
	top_tokens = {}
	if(tokens.length > 0) {
		for (let i = 0; i < TOP_SIZE; i++) {
			const address = Object.keys(tokens_list)[i]
			const symbol = tokens_list[address]
			const name = tokens_data[address].n
			const price = tokens_data[address].p
			const volume = pancakeswap_volume[address][pancakeswap_volume[address].length-1].v - pancakeswap_volume[address][0].v

			top_tokens[address] = {
				s: symbol,
				n: name,
				p: price,
				v: volume,
				chart: tokens_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
			}
		}
	}





	/* Store files */

	// Update the tokens list
	let pathFile = path.join(dir_home, 'pancake.json')
	writeFile( pathFile, JSON.stringify( tokens_list ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Top 10 tokens list
	pathFile = path.join(dir_home, 'pancake-top.json')
	writeFile( pathFile, JSON.stringify( top_tokens ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the tokens simple data
	pathFile = path.join(dir_home, 'pancake-simple.json')
	writeFile( pathFile, JSON.stringify( tokens_data ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the tokens charts
	pathFile = path.join(dir_home, 'pancake-charts.json')
	writeFile( pathFile, JSON.stringify( tokens_charts ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Pancakeswap volumeUSD
	pathFile = path.join(dir_home, 'pancake-volume.json')
	writeFile( pathFile, JSON.stringify( pancakeswap_volume ), 'utf8', (err) => {
		if (err) throw err
	})

}


// Program - Uniswap
async function launchUniswap() {
	// loop
	setTimeout(launchUniswap, REALTIME) // every few seconds

	let uniswap_data_file = {}
	let uniswap_charts_file = {}
	let uniswap_volume_file = {}

	let uniswap_list = {}
	let uniswap_data = {}
	let uniswap_charts = {}
	let uniswap_volume = {}

	try {
		uniswap_data_file = readFileSync(path.join(dir_home, 'uniswap-simple.json'), 'utf8')
		uniswap_data = JSON.parse(uniswap_data_file.toString())
		let pathFile = path.join(dir_home, 'save_uniswap-simple.json')
		writeFileSync(pathFile, JSON.stringify( uniswap_data ), 'utf8')
	} catch(error) {
		console.log('uniswap-simple.json', error)
		try {
			uniswap_data_file = readFileSync(path.join(dir_home, 'save_uniswap-simple.json'), 'utf8')
			uniswap_data = JSON.parse(uniswap_data_file.toString())
		} catch {
			return
		}
	}

	try {
		uniswap_charts_file = readFileSync(path.join(dir_home, 'uniswap-charts.json'), 'utf8')
		uniswap_charts = JSON.parse(uniswap_charts_file.toString())
		let pathFile = path.join(dir_home, 'save_uniswap-charts.json')
		writeFileSync(pathFile, JSON.stringify( uniswap_charts ), 'utf8')
	} catch(error) {
		console.log('uniswap-charts.json', error)
		try {
			uniswap_charts_file = readFileSync(path.join(dir_home, 'save_uniswap-charts.json'), 'utf8')
			uniswap_charts = JSON.parse(uniswap_charts_file.toString())
		} catch {
			return
		}
	}

	try {
		uniswap_volume_file = readFileSync(path.join(dir_home, 'uniswap-volume.json'), 'utf8')
		uniswap_volume = JSON.parse(uniswap_volume_file.toString())
		let pathFile = path.join(dir_home, 'save_uniswap-volume.json')
		writeFileSync(pathFile, JSON.stringify( uniswap_volume ), 'utf8')
	} catch(error) {
		console.log('uniswap-volume.json', error)
		try {
			uniswap_volume_file = readFileSync(path.join(dir_home, 'save_uniswap-volume.json'), 'utf8')
			uniswap_volume = JSON.parse(uniswap_volume_file.toString())
		} catch {
			return
		}
	}

	if(Object.keys(uniswap_data).length < 1 || Object.keys(uniswap_charts).length < 1 || Object.keys(uniswap_volume).length < 1) {
		return
	}


	// get data from Uniswap
	const top = await getUniswapV3TopTokens()
	const topV2 = await getUniswapV2TopTokens()


	const time = Date.now()
	const tokensV3 = top.data ? top.data.tokens : []
	const tokensV2 = topV2.data ? topV2.data.tokens : []

	// Keep in v2 only tokens that are not already in v3
	let filteredv2 = tokensV2.filter(token => !tokensV3.map(item => item.id).includes(token.id))
	// then concat tokanV2 and filteredTokensV2
	const tokens = tokensV3.concat(filteredv2)

	const eth_price = top.data ? top.data.bundle.ethPriceUSD : 0
	if(eth_price === 0) return

	tokens.forEach(token => {
		const address = token.id
		const symbol = token.symbol
		const name = token.name
		const price_ETH = token.derivedETH === '0' && tokensV2.find(item => item.id === address) ? tokensV2.find(item => item.id === address).derivedETH : token.derivedETH
		const price = price_ETH * eth_price
		const volumeUSD = token.volumeUSD ? token.volumeUSD : token.tradeVolumeUSD

		// create Uniswap list
		uniswap_list[address] = symbol


		// update Uniswap simple data
		uniswap_data[address] = {
			s: symbol,
			n: name,
			p: price,
			t: time
		}

		// update Uniswap charts
		//
		if(uniswap_charts[address]) {
			if(time - uniswap_charts[address].chart_often[uniswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
				uniswap_charts[address].chart_often.push({
					t: time,
					p: price,
				})
				uniswap_charts[address].chart_often = uniswap_charts[address].chart_often.slice(-HISTORY_SIZE)
			}
		} else {
			uniswap_charts[address] = {
				s: symbol,
				n: name,
				chart_often: [{
					t: time,
					p: price,
				}]
			}
		}
		if(uniswap_volume[address]) {
			if(time - uniswap_volume[address][uniswap_volume[address].length-1]['t'] > OFTEN) {
				uniswap_volume[address].push({
					t: time,
					v: volumeUSD,
				})
				uniswap_volume[address] = uniswap_volume[address].slice(-VOLUME_SIZE)
			}
		} else {
			uniswap_volume[address] = [{
				t: time,
				v: volumeUSD,
			}]
		}
		if(uniswap_charts[address].chart_4h) {
			if((time - uniswap_charts[address].chart_4h[uniswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
				uniswap_charts[address].chart_4h.push({
					t: time,
					p: price,
				})
				uniswap_charts[address].chart_4h = uniswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
			}
		} else {
			uniswap_charts[address].chart_4h = [{
				t: time,
				p: price,
			}]
		}
		if(uniswap_charts[address].chart_1d) {
			if((time - uniswap_charts[address].chart_1d[uniswap_charts[address].chart_1d.length-1]['t']) > DAY) {
				uniswap_charts[address].chart_1d.push({
					t: time,
					p: price,
				})
				uniswap_charts[address].chart_1d = uniswap_charts[address].chart_1d.slice(-HISTORY_SIZE)
			}
		} else {
			uniswap_charts[address].chart_1d = [{
				t: time,
				p: price
			}]
		}
		if(uniswap_charts[address].chart_1w) {
			if((time - uniswap_charts[address].chart_1w[uniswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
				uniswap_charts[address].chart_1w.push({
					t: time,
					p: price,
				})
				uniswap_charts[address].chart_1w = uniswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
			}
		} else {
			uniswap_charts[address].chart_1w = [{
				t: time,
				p: price,
			}]
		}
	})

	// Sort tokens depending on volume
	uniswap_list = sortTokensByVolume(uniswap_list, uniswap_volume)

	// build Top 10 list of Uniswap
	let uniswap_top = {}
	if(tokens.length > 0) {
		for (let i = 0; i < TOP_SIZE; i++) {
			const address = Object.keys(uniswap_list)[i]
			const symbol = uniswap_list[address]
			const name = uniswap_data[address].n
			const price = uniswap_data[address].p
			const volume = uniswap_volume[address][uniswap_volume[address].length-1].v - uniswap_volume[address][0].v

			uniswap_top[address] = {
				s: symbol,
				n: name,
				p: price,
				v: volume,
				chart: uniswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
			}
		}
	}


	/* Store files */

	// Update the Uniswap list
	if(Object.keys(uniswap_list).length > 0) {
		let pathFile = path.join(dir_home, 'uniswap.json')
		writeFile( pathFile, JSON.stringify( uniswap_list ), 'utf8', (err) => {
			if (err) throw err
		})
	}

	// Update the Uniswap Top 10
	if(Object.keys(uniswap_top).length > 0) {
		let pathFile = path.join(dir_home, 'uniswap-top.json')
		writeFile( pathFile, JSON.stringify( uniswap_top ), 'utf8', (err) => {
			if (err) throw err
		})
	}

	// Update the Uniswap simple data
	if(Object.keys(uniswap_data).length > 0) {
		let pathFile = path.join(dir_home, 'uniswap-simple.json')
		writeFile( pathFile, JSON.stringify( uniswap_data ), 'utf8', (err) => {
			if (err) throw err
		})
	}

	// Update the Uniswap charts
	if(Object.keys(uniswap_charts).length > 0) {
		let pathFile = path.join(dir_home, 'uniswap-charts.json')
		writeFile( pathFile, JSON.stringify( uniswap_charts ), 'utf8', (err) => {
			if (err) throw err
		})
	}

	// Update the Uniswap volumeUSD
	if(Object.keys(uniswap_volume).length > 0) {
		let pathFile = path.join(dir_home, 'uniswap-volume.json')
		writeFile( pathFile, JSON.stringify( uniswap_volume ), 'utf8', (err) => {
			if (err) throw err
		})
	}

}


// Program - Quickswap
async function launchQuickswap() {
	// loop
	setTimeout(launchQuickswap, REALTIME) // every few seconds

	let quickswap_data_file = {}
	let quickswap_charts_file = {}
	let quickswap_volume_file = {}

	try {
		quickswap_data_file = readFileSync(path.join(dir_home, 'quickswap-simple.json'), 'utf8')
		quickswap_data = JSON.parse(quickswap_data_file.toString())
		let pathFile = path.join(dir_home, 'save_quickswap-simple.json')
		writeFileSync(pathFile, JSON.stringify( quickswap_data ), 'utf8')
	} catch(error) {
		console.log('quickswap-simple.json', error)
		quickswap_data_file = readFileSync(path.join(dir_home, 'save_quickswap-simple.json'), 'utf8')
		quickswap_data = JSON.parse(quickswap_data_file.toString())
	}

	try {
		quickswap_charts_file = readFileSync(path.join(dir_home, 'quickswap-charts.json'), 'utf8')
		quickswap_charts = JSON.parse(quickswap_charts_file.toString())
		let pathFile = path.join(dir_home, 'save_quickswap-charts.json')
		writeFileSync(pathFile, JSON.stringify( quickswap_charts ), 'utf8')
	} catch(error) {
		console.log('quickswap-charts.json', error)
		quickswap_charts_file = readFileSync(path.join(dir_home, 'save_quickswap-charts.json'), 'utf8')
		quickswap_charts = JSON.parse(quickswap_charts_file.toString())
	}

	try {
		quickswap_volume_file = readFileSync(path.join(dir_home, 'quickswap-volume.json'), 'utf8')
		quickswap_volume = JSON.parse(quickswap_volume_file.toString())
		let pathFile = path.join(dir_home, 'save_quickswap-volume.json')
		writeFileSync(pathFile, JSON.stringify( quickswap_volume ), 'utf8')
	} catch(error) {
		console.log('quickswap-volume.json', error)
		quickswap_volume_file = readFileSync(path.join(dir_home, 'save_quickswap-volume.json'), 'utf8')
		quickswap_volume = JSON.parse(quickswap_volume_file.toString())
	}


	quickswap_list = {}


	// get data from Quickswap
	const top = await getQuickswapTopTokens()



	const time = Date.now()
	const tokens = top.data ? top.data.tokens : []

	const eth_price = top.data ? top.data.bundle.ethPrice : 0
	if(eth_price === 0) return

	tokens.forEach(token => {
		const address = token.id
		const symbol = token.symbol
		const name = token.name
		const price_ETH = token.derivedETH
		const price = price_ETH * eth_price
		const volumeUSD = token.volumeUSD

		// create Quickswap list
		quickswap_list[address] = symbol


		// update Quickswap simple data
		quickswap_data[address] = {
			s: symbol,
			n: name,
			p: price,
			t: time
		}

		// update Quickswap charts
		//
		if(quickswap_charts[address]) {
			if(time - quickswap_charts[address].chart_often[quickswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
				quickswap_charts[address].chart_often.push({
					t: time,
					p: price,
				})
				quickswap_charts[address].chart_often = quickswap_charts[address].chart_often.slice(-HISTORY_SIZE)
			}
		} else {
			quickswap_charts[address] = {
				s: symbol,
				n: name,
				chart_often: [{
					t: time,
					p: price,
				}]
			}
		}
		if(quickswap_volume[address]) {
			if(time - quickswap_volume[address][quickswap_volume[address].length-1]['t'] > OFTEN) {
				quickswap_volume[address].push({
					t: time,
					v: volumeUSD,
				})
				quickswap_volume[address] = quickswap_volume[address].slice(-VOLUME_SIZE)
			}
		} else {
			quickswap_volume[address] = [{
				t: time,
				v: volumeUSD,
			}]
		}
		if(quickswap_charts[address].chart_4h) {
			if((time - quickswap_charts[address].chart_4h[quickswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
				quickswap_charts[address].chart_4h.push({
					t: time,
					p: price,
				})
				quickswap_charts[address].chart_4h = quickswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
			}
		} else {
			quickswap_charts[address].chart_4h = [{
				t: time,
				p: price,
			}]
		}
		if(quickswap_charts[address].chart_1d) {
			if((time - quickswap_charts[address].chart_1d[quickswap_charts[address].chart_1d.length-1]['t']) > DAY) {
				quickswap_charts[address].chart_1d.push({
					t: time,
					p: price,
				})
				quickswap_charts[address].chart_1d = quickswap_charts[address].chart_1d.slice(-HISTORY_SIZE)
			}
		} else {
			quickswap_charts[address].chart_1d = [{
				t: time,
				p: price
			}]
		}
		if(quickswap_charts[address].chart_1w) {
			if((time - quickswap_charts[address].chart_1w[quickswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
				quickswap_charts[address].chart_1w.push({
					t: time,
					p: price,
				})
				quickswap_charts[address].chart_1w = quickswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
			}
		} else {
			quickswap_charts[address].chart_1w = [{
				t: time,
				p: price,
			}]
		}
	})

	// Sort tokens depending on volume
	quickswap_list = sortTokensByVolume(quickswap_list, quickswap_volume)

	// build Top 10 list of Quickswap
	quickswap_top = {}
	if(tokens.length > 0) {
		for (let i = 0; i < TOP_SIZE; i++) {
			const address = Object.keys(quickswap_list)[i]
			const symbol = quickswap_list[address]
			const name = quickswap_data[address].n
			const price = quickswap_data[address].p
			const volume = quickswap_volume[address][quickswap_volume[address].length-1].v - quickswap_volume[address][0].v

			quickswap_top[address] = {
				s: symbol,
				n: name,
				p: price,
				v: volume,
				chart: quickswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
			}
		}
	}


	/* Store files */

	// Update the Quickswap list
	let pathFile = path.join(dir_home, 'quickswap.json')
	writeFile( pathFile, JSON.stringify( quickswap_list ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Quickswap Top 10
	pathFile = path.join(dir_home, 'quickswap-top.json')
	writeFile( pathFile, JSON.stringify( quickswap_top ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Quickswap simple data
	pathFile = path.join(dir_home, 'quickswap-simple.json')
	writeFile( pathFile, JSON.stringify( quickswap_data ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Quickswap charts
	pathFile = path.join(dir_home, 'quickswap-charts.json')
	writeFile( pathFile, JSON.stringify( quickswap_charts ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Quickswap volumeUSD
	pathFile = path.join(dir_home, 'quickswap-volume.json')
	writeFile( pathFile, JSON.stringify( quickswap_volume ), 'utf8', (err) => {
		if (err) throw err
	})

}


// Program - Spiritswap
async function launchSpiritswap() {
	// loop
	setTimeout(launchSpiritswap, REALTIME) // every few seconds

	let spiritswap_data_file = {}
	let spiritswap_charts_file = {}
	let spiritswap_volume_file = {}

	try {
		spiritswap_data_file = readFileSync(path.join(dir_home, 'spiritswap-simple.json'), 'utf8')
		spiritswap_data = JSON.parse(spiritswap_data_file.toString())
		let pathFile = path.join(dir_home, 'save_spiritswap-simple.json')
		writeFileSync(pathFile, JSON.stringify( spiritswap_data ), 'utf8')
	} catch(error) {
		console.log('spiritswap-simple.json', error)
		spiritswap_data_file = readFileSync(path.join(dir_home, 'save_spiritswap-simple.json'), 'utf8')
		spiritswap_data = JSON.parse(spiritswap_data_file.toString())
	}

	try {
		spiritswap_charts_file = readFileSync(path.join(dir_home, 'spiritswap-charts.json'), 'utf8')
		spiritswap_charts = JSON.parse(spiritswap_charts_file.toString())
		let pathFile = path.join(dir_home, 'save_spiritswap-charts.json')
		writeFileSync(pathFile, JSON.stringify( spiritswap_charts ), 'utf8')
	} catch(error) {
		console.log('spiritswap-charts.json', error)
		spiritswap_charts_file = readFileSync(path.join(dir_home, 'save_spiritswap-charts.json'), 'utf8')
		spiritswap_charts = JSON.parse(spiritswap_charts_file.toString())
	}

	try {
		spiritswap_volume_file = readFileSync(path.join(dir_home, 'spiritswap-volume.json'), 'utf8')
		spiritswap_volume = JSON.parse(spiritswap_volume_file.toString())
		let pathFile = path.join(dir_home, 'save_spiritswap-volume.json')
		writeFileSync(pathFile, JSON.stringify( spiritswap_volume ), 'utf8')
	} catch(error) {
		console.log('spiritswap-volume.json', error)
		spiritswap_volume_file = readFileSync(path.join(dir_home, 'save_spiritswap-volume.json'), 'utf8')
		spiritswap_volume = JSON.parse(spiritswap_volume_file.toString())
	}


	spiritswap_list = {}

	// get data from Spiritswap
	let top = {}
	try {
		top = await getSpiritswapTopTokens()
	} catch(error) {
		console.log(error)
		return
	}


	const time = Date.now()
	const tokens = top.data ? top.data.tokens : []

	const ftm_price = top.data ? top.data.bundle.ftmPrice : 0
	if(ftm_price === 0) return

	tokens.forEach(token => {
		const address = token.id
		const symbol = token.symbol
		const name = token.name
		const price_FTM = token.derivedFTM
		const price = price_FTM * ftm_price
		const volumeUSD = token.tradeVolumeUSD

		// create Spiritswap list
		spiritswap_list[address] = symbol


		// update Spiritswap simple data
		spiritswap_data[address] = {
			s: symbol,
			n: name,
			p: price,
			t: time
		}

		// update Spiritswap charts
		//
		if(spiritswap_charts[address]) {
			if(time - spiritswap_charts[address].chart_often[spiritswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
				spiritswap_charts[address].chart_often.push({
					t: time,
					p: price,
				})
				spiritswap_charts[address].chart_often = spiritswap_charts[address].chart_often.slice(-HISTORY_SIZE)
			}
		} else {
			spiritswap_charts[address] = {
				s: symbol,
				n: name,
				chart_often: [{
					t: time,
					p: price,
				}]
			}
		}
		if(spiritswap_volume[address]) {
			if(time - spiritswap_volume[address][spiritswap_volume[address].length-1]['t'] > OFTEN) {
				spiritswap_volume[address].push({
					t: time,
					v: volumeUSD,
				})
				spiritswap_volume[address] = spiritswap_volume[address].slice(-VOLUME_SIZE)
			}
		} else {
			spiritswap_volume[address] = [{
				t: time,
				v: volumeUSD,
			}]
		}
		if(spiritswap_charts[address].chart_4h) {
			if((time - spiritswap_charts[address].chart_4h[spiritswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
				spiritswap_charts[address].chart_4h.push({
					t: time,
					p: price,
				})
				spiritswap_charts[address].chart_4h = spiritswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
			}
		} else {
			spiritswap_charts[address].chart_4h = [{
				t: time,
				p: price,
			}]
		}
		if(spiritswap_charts[address].chart_1d) {
			if((time - spiritswap_charts[address].chart_1d[spiritswap_charts[address].chart_1d.length-1]['t']) > DAY) {
				spiritswap_charts[address].chart_1d.push({
					t: time,
					p: price,
				})
				spiritswap_charts[address].chart_1d = spiritswap_charts[address].chart_1d.slice(-HISTORY_SIZE)
			}
		} else {
			spiritswap_charts[address].chart_1d = [{
				t: time,
				p: price
			}]
		}
		if(spiritswap_charts[address].chart_1w) {
			if((time - spiritswap_charts[address].chart_1w[spiritswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
				spiritswap_charts[address].chart_1w.push({
					t: time,
					p: price,
				})
				spiritswap_charts[address].chart_1w = spiritswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
			}
		} else {
			spiritswap_charts[address].chart_1w = [{
				t: time,
				p: price,
			}]
		}
	})

	// Sort tokens depending on volume
	spiritswap_list = sortTokensByVolume(spiritswap_list, spiritswap_volume)

	// build Top 10 list of Spiritswap
	spiritswap_top = {}
	if(tokens.length > 0) {
		for (let i = 0; i < TOP_SIZE; i++) {
			const address = Object.keys(spiritswap_list)[i]
			const symbol = spiritswap_list[address]
			const name = spiritswap_data[address].n
			const price = spiritswap_data[address].p
			const volume = spiritswap_volume[address][spiritswap_volume[address].length-1].v - spiritswap_volume[address][0].v

			spiritswap_top[address] = {
				s: symbol,
				n: name,
				p: price,
				v: volume,
				chart: spiritswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
			}
		}
	}


	/* Store files */

	// Update the Spiritswap list
	let pathFile = path.join(dir_home, 'spiritswap.json')
	writeFile( pathFile, JSON.stringify( spiritswap_list ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Spiritswap Top 10
	pathFile = path.join(dir_home, 'spiritswap-top.json')
	writeFile( pathFile, JSON.stringify( spiritswap_top ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Spiritswap simple data
	pathFile = path.join(dir_home, 'spiritswap-simple.json')
	writeFile( pathFile, JSON.stringify( spiritswap_data ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Spiritswap charts
	pathFile = path.join(dir_home, 'spiritswap-charts.json')
	writeFile( pathFile, JSON.stringify( spiritswap_charts ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Spiritswap volumeUSD
	pathFile = path.join(dir_home, 'spiritswap-volume.json')
	writeFile( pathFile, JSON.stringify( spiritswap_volume ), 'utf8', (err) => {
		if (err) throw err
	})

}



// Program - Honeyswap
async function launchHoneyswap() {
	// loop
	setTimeout(launchHoneyswap, REALTIME) // every few seconds

	let honeyswap_data_file = {}
	let honeyswap_charts_file = {}
	let honeyswap_volume_file = {}

	try {
		honeyswap_data_file = readFileSync(path.join(dir_home, 'honeyswap-simple.json'), 'utf8')
		honeyswap_data = JSON.parse(honeyswap_data_file.toString())
		let pathFile = path.join(dir_home, 'save_honeyswap-simple.json')
		writeFileSync(pathFile, JSON.stringify( honeyswap_data ), 'utf8')
	} catch(error) {
		console.log('honeyswap-simple.json', error)
		honeyswap_data_file = readFileSync(path.join(dir_home, 'save_honeyswap-simple.json'), 'utf8')
		honeyswap_data = JSON.parse(honeyswap_data_file.toString())
	}

	try {
		honeyswap_charts_file = readFileSync(path.join(dir_home, 'honeyswap-charts.json'), 'utf8')
		honeyswap_charts = JSON.parse(honeyswap_charts_file.toString())
		let pathFile = path.join(dir_home, 'save_honeyswap-charts.json')
		writeFileSync(pathFile, JSON.stringify( honeyswap_charts ), 'utf8')
	} catch(error) {
		console.log('honeyswap-charts.json', error)
		honeyswap_charts_file = readFileSync(path.join(dir_home, 'save_honeyswap-charts.json'), 'utf8')
		honeyswap_charts = JSON.parse(honeyswap_charts_file.toString())
	}

	try {
		honeyswap_volume_file = readFileSync(path.join(dir_home, 'honeyswap-volume.json'), 'utf8')
		honeyswap_volume = JSON.parse(honeyswap_volume_file.toString())
		let pathFile = path.join(dir_home, 'save_honeyswap-volume.json')
		writeFileSync(pathFile, JSON.stringify( honeyswap_volume ), 'utf8')
	} catch(error) {
		console.log('honeyswap-volume.json', error)
		honeyswap_volume_file = readFileSync(path.join(dir_home, 'save_honeyswap-volume.json'), 'utf8')
		honeyswap_volume = JSON.parse(honeyswap_volume_file.toString())
	}


	honeyswap_list = {}

	// get data from Honeyswap
	let top = {}
	try {
		top = await getHoneyswapTopTokens()
	} catch(error) {
		console.log(error)
		return
	}


	const time = Date.now()
	const tokens = top.data ? top.data.tokens : []

	const eth_price = top.data ? top.data.bundle.ethPrice : 0
	if(eth_price === 0) return

	tokens.forEach(token => {
		const address = token.id
		const symbol = token.symbol
		const name = token.name
		const price_ETH = token.derivedETH
		const price = price_ETH * eth_price
		const volumeUSD = token.tradeVolumeUSD

		// create Honeyswap list
		honeyswap_list[address] = symbol


		// update Honeyswap simple data
		honeyswap_data[address] = {
			s: symbol,
			n: name,
			p: price,
			t: time
		}

		// update Honeyswap charts
		//
		if(honeyswap_charts[address]) {
			if(time - honeyswap_charts[address].chart_often[honeyswap_charts[address].chart_often.length-1]['t'] > OFTEN) {
				honeyswap_charts[address].chart_often.push({
					t: time,
					p: price,
				})
				honeyswap_charts[address].chart_often = honeyswap_charts[address].chart_often.slice(-HISTORY_SIZE)
			}
		} else {
			honeyswap_charts[address] = {
				s: symbol,
				n: name,
				chart_often: [{
					t: time,
					p: price,
				}]
			}
		}
		if(honeyswap_volume[address]) {
			if(time - honeyswap_volume[address][honeyswap_volume[address].length-1]['t'] > OFTEN) {
				honeyswap_volume[address].push({
					t: time,
					v: volumeUSD,
				})
				honeyswap_volume[address] = honeyswap_volume[address].slice(-VOLUME_SIZE)
			}
		} else {
			honeyswap_volume[address] = [{
				t: time,
				v: volumeUSD,
			}]
		}
		if(honeyswap_charts[address].chart_4h) {
			if((time - honeyswap_charts[address].chart_4h[honeyswap_charts[address].chart_4h.length-1]['t']) > HOURS) {
				honeyswap_charts[address].chart_4h.push({
					t: time,
					p: price,
				})
				honeyswap_charts[address].chart_4h = honeyswap_charts[address].chart_4h.slice(-HISTORY_SIZE)
			}
		} else {
			honeyswap_charts[address].chart_4h = [{
				t: time,
				p: price,
			}]
		}
		if(honeyswap_charts[address].chart_1d) {
			if((time - honeyswap_charts[address].chart_1d[honeyswap_charts[address].chart_1d.length-1]['t']) > DAY) {
				honeyswap_charts[address].chart_1d.push({
					t: time,
					p: price,
				})
				honeyswap_charts[address].chart_1d = honeyswap_charts[address].chart_1d.slice(-HISTORY_SIZE)
			}
		} else {
			honeyswap_charts[address].chart_1d = [{
				t: time,
				p: price
			}]
		}
		if(honeyswap_charts[address].chart_1w) {
			if((time - honeyswap_charts[address].chart_1w[honeyswap_charts[address].chart_1w.length-1]['t']) > WEEK) {
				honeyswap_charts[address].chart_1w.push({
					t: time,
					p: price,
				})
				honeyswap_charts[address].chart_1w = honeyswap_charts[address].chart_1w.slice(-HISTORY_SIZE)
			}
		} else {
			honeyswap_charts[address].chart_1w = [{
				t: time,
				p: price,
			}]
		}
	})

	// Sort tokens depending on volume
	honeyswap_list = sortTokensByVolume(honeyswap_list, honeyswap_volume)

	// build Top 10 list of Honeyswap
	honeyswap_top = {}
	if(tokens.length > 0) {
		for (let i = 0; i < TOP_SIZE; i++) {
			const address = Object.keys(honeyswap_list)[i]
			const symbol = honeyswap_list[address]
			const name = honeyswap_data[address].n
			const price = honeyswap_data[address].p
			const volume = honeyswap_volume[address][honeyswap_volume[address].length-1].v - honeyswap_volume[address][0].v

			honeyswap_top[address] = {
				s: symbol,
				n: name,
				p: price,
				v: volume,
				chart: honeyswap_charts[address].chart_often.slice(-HISTORY_SIZE_24H)
			}
		}
	}


	/* Store files */

	// Update the Honeyswap list
	let pathFile = path.join(dir_home, 'honeyswap.json')
	writeFile( pathFile, JSON.stringify( honeyswap_list ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Honeyswap Top 10
	pathFile = path.join(dir_home, 'honeyswap-top.json')
	writeFile( pathFile, JSON.stringify( honeyswap_top ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Honeyswap simple data
	pathFile = path.join(dir_home, 'honeyswap-simple.json')
	writeFile( pathFile, JSON.stringify( honeyswap_data ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Honeyswap charts
	pathFile = path.join(dir_home, 'honeyswap-charts.json')
	writeFile( pathFile, JSON.stringify( honeyswap_charts ), 'utf8', (err) => {
		if (err) throw err
	})

	// Update the Honeyswap volumeUSD
	pathFile = path.join(dir_home, 'honeyswap-volume.json')
	writeFile( pathFile, JSON.stringify( honeyswap_volume ), 'utf8', (err) => {
		if (err) throw err
	})

}




/* MAIN */
setTimeout(launchUniswap, 2000)
setTimeout(launchQuickswap, 5000)
setTimeout(launchSpiritswap, 8000)
setTimeout(launchHoneyswap, 11000)
setTimeout(launch, 14000)





/* Useful - Sort a List depending on Volume */
const sortTokensByVolume = (listToSort, listVolume) => {
	return Object.fromEntries(
		Object.entries(listToSort).sort(
			(a, b) => {
				const addrA = a[0]
				const addrB = b[0]
				const volA = listVolume[addrA][listVolume[addrA].length-1].v - listVolume[addrA][0].v
				const volB = listVolume[addrB][listVolume[addrB].length-1].v - listVolume[addrB][0].v
				return volB - volA
			}
		)
	)
}



/* server */
const port = process.env.PORT || 3000
const app = express()

// Pancake URLs
app.get('/list/pancake', (req, res) => res.json(tokens_list))
app.get('/top/pancake', (req, res) => res.json(top_tokens))
app.get('/simple/pancake', (req, res) => res.json(tokens_data))
app.get('/charts/pancake', (req, res) => res.json(tokens_charts))
// Uniswap URLs
app.get('/list/uniswap', (req, res) => {
	res.header('Content-Type','application/json')
	res.sendFile(path.join(dir_home, 'uniswap.json'))
})
app.get('/top/uniswap', (req, res) => {
	res.header('Content-Type','application/json')
	res.sendFile(path.join(dir_home, 'uniswap-top.json'))
})
app.get('/simple/uniswap', (req, res) => {
	res.header('Content-Type','application/json')
	res.sendFile(path.join(dir_home, 'uniswap-simple.json'))
})
app.get('/charts/uniswap', (req, res) => {
	res.header('Content-Type','application/json')
	res.sendFile(path.join(dir_home, 'uniswap-charts.json'))
})
// Quickswap URLs
app.get('/list/quickswap', (req, res) => res.json(quickswap_list))
app.get('/top/quickswap', (req, res) => res.json(quickswap_top))
app.get('/simple/quickswap', (req, res) => res.json(quickswap_data))
app.get('/charts/quickswap', (req, res) => res.json(quickswap_charts))
// Spiritswap URLs
app.get('/list/spiritswap', (req, res) => res.json(spiritswap_list))
app.get('/top/spiritswap', (req, res) => res.json(spiritswap_top))
app.get('/simple/spiritswap', (req, res) => res.json(spiritswap_data))
app.get('/charts/spiritswap', (req, res) => res.json(spiritswap_charts))
// Honeyswap URLs
app.get('/list/honeyswap', (req, res) => res.json(honeyswap_list))
app.get('/top/honeyswap', (req, res) => res.json(honeyswap_top))
app.get('/simple/honeyswap', (req, res) => res.json(honeyswap_data))
app.get('/charts/honeyswap', (req, res) => res.json(honeyswap_charts))

app.listen(port, () => console.log(`Backend start at ${port}`))

http.createServer((req, res) => {
	res.writeHead(200, {'Content-Type': 'text/html'})
	res.end('Hello World')
})
