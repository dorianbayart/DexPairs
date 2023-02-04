'use strict'

import fetch from 'node-fetch'
import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'
import { MongoClient } from 'mongodb'


const PER_PAGE = 250
const SUPPORTED_PROTOCOLS = ['ethereum', 'cronos', 'binance-smart-chain', 'xdai', 'polygon-pos', 'fantom', 'arbitrum-one', 'celo', 'avalanche']
const BASE_URL = 'https://api.coingecko.com/api/v3/'
const URL_LIST_TOKENS = `${BASE_URL}coins/list/?include_platform=true`
const URL_FETCH_PRICES = `${BASE_URL}coins/markets?vs_currency=usd&per_page=${PER_PAGE}`

const MONGO_URL = 'mongodb://localhost:27017'
const DN_NAME = 'DexPairs'


let tokensList = []

const whiteList = [
	'celo',
	'wbnb',
	'weth',
	'wmatic',
	'wrapped-avax',
	'wrapped-cro',
	'wrapped-fantom',
	'wrapped-xdai'
]


const dir_home = os.homedir()


buildList()



async function buildList() {
	const MONGO_CLIENT = new MongoClient(MONGO_URL)
	await MONGO_CLIENT.connect()
	const db = MONGO_CLIENT.db(DN_NAME)
	const collection = db.collection('coingecko')
	await getList(collection)

	if(tokensList.length === 0) {
		return
	}

	await updateList(collection)

	if(Math.random() < 0.01) { // Sometimes backup file
		await writeBackupOnDisk()
	}
	setTimeout(() => MONGO_CLIENT.close(), 500)
}


async function getList(collection) {
	try {

		tokensList = await collection.find({}).toArray()

		if(tokensList.length === 0 || Math.random() > 0.95) {
			// fetch tokens from CoinGecko
			let data = await fetch(URL_LIST_TOKENS)
			let list = await data.json()
			// keep only tokens on supported protocols
			let filtered = list.filter((token) => Object.values(token.platforms) && Object.values(token.platforms)[0] !== '' && Object.keys(token.platforms).some((platform) => SUPPORTED_PROTOCOLS.includes(platform)))

			//filtered.forEach(async (item) => {
			for(const item of filtered) {
				const query = { id: item.id }
		  	const values = {
					$set: {
						id: item.id,
						symbol: item.symbol,
						name: item.name,
						platforms: Object.entries(item.platforms).map(e => e.join('-')).join(':')
					}
				}
				const options = { upsert: true }
				const existingToken = tokensList.find(token => token.id === item.id)
				if(!existingToken || existingToken.symbol !== item.symbol || existingToken.name !== item.name || !existingToken.platforms.localeCompare(item.platforms)) {
					await collection.updateOne(query, values, options)
				}
			}

			SUPPORTED_PROTOCOLS.forEach(logByProtocol)
		}
	} catch(error) {
		console.error(error)
	}
}



async function updateList(collection) {
	let fewPrices = await fetchPrices()

	for(const item of fewPrices) {
		const query = { id: item.id }
  	const values = {
			$set: {
				price: item.price,
				logo: item.logo,
				market_cap: item.market_cap && item.market_cap > 0 ? item.market_cap : whiteList.includes(item.id),
				market_cap_rank: item.market_cap_rank
			}
		}
		const result = await collection.updateOne(query, values)
	}
}


async function writeBackupOnDisk() {
	console.log('Write a backup of Coingecko prices')
	try {
		await fs.writeFile(path.join(dir_home, 'save_coingecko.json'), JSON.stringify(tokensList))
	} catch (err) {
		console.error(err)
	}
}



async function fetchPrices() {
	let randomItems = getRandomItemsFromArray(tokensList, PER_PAGE).map((item) => item.id)
	let parameter = '&ids=' + randomItems.join()
	let data = await fetch(URL_FETCH_PRICES + parameter)
	let json = await data.json()

	return json ? json.map((token) => {
		return {
			id: token.id,
			price: token.current_price,
			logo: token.image,
			market_cap: token.market_cap,
			market_cap_rank: token.market_cap_rank
		}
	}) : []
}





function logByProtocol(protocol, index, array) {
	console.log(`${filterByProtocol(tokensList, protocol).length} items on ${protocol}`)
}


function filterByProtocol(list, protocol) {
	return list.filter((token) => token.platforms && token.platforms.includes(protocol))
}


function getRandomItemsFromArray(arr, n) {
	if (n > arr.length)
		throw new RangeError('getRandomItemsFromArray: too few elements in the array')
	let items = []
	while(items.length < n) {
		let x = Math.floor(Math.random() * arr.length)
		if(!items.includes(arr[x])) {
			items.push(arr[x])
		}
	}
	return items
}
