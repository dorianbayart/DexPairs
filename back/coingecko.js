'use strict'

const fetch = require('node-fetch')
const os = require('os')
const path = require('path')
const fs = require('fs').promises

const PER_PAGE = 250
const SUPPORTED_PROTOCOLS = ['ethereum', 'polygon-pos', 'binance-smart-chain', 'fantom', 'xdai']
const BASE_URL = 'https://api.coingecko.com/api/v3/'
const URL_LIST_TOKENS = `${BASE_URL}coins/list/?include_platform=true`
const URL_FETCH_PRICES = `${BASE_URL}coins/markets?vs_currency=usd&per_page=${PER_PAGE}`


let tokensList = []


const dir_home = os.homedir()


buildList()



async function buildList() {
	await getList()

	if(tokensList.length === 0) {
		return
	}

	await updateList()

	await writeOnDisk()
}


async function getList() {
	try {
		// get the file on disk
		let data = await readOnDisk()
		if(!data) {
			return
		}

		tokensList = data

		if(tokensList.length === 0 || Math.random() > 0.95) {
			// fetch tokens from CoinGecko
			let data = await fetch(URL_LIST_TOKENS)
			let list = await data.json()
			// keep only tokens on supported protocols
			let filtered = list.filter((token) => Object.values(token.platforms) && Object.values(token.platforms)[0] !== '' && Object.keys(token.platforms).some((platform) => SUPPORTED_PROTOCOLS.includes(platform)))
			console.log(filtered.length)

			filtered.forEach((item) => {
				let tokenIndex = tokensList.findIndex((token) => token.id === item.id)
				if(tokenIndex > 0) {
					tokensList[tokenIndex] = {
						...tokensList[tokenIndex],
						...item
					}
				} else {
					tokensList.push(item)
				}
			})
		}
	} catch(error) {
		console.error(error)
	}

	SUPPORTED_PROTOCOLS.forEach(logByProtocol)
}




async function updateList() {
	let fewPrices = await fetchPrices()

	fewPrices.forEach((item) => {
		let tokenIndex = tokensList.findIndex((token) => token.id === item.id)
		tokensList[tokenIndex] = {
			...tokensList[tokenIndex],
			...item
		}
	})
}


async function readOnDisk() {
	try {
		const file = await fs.readFile(path.join(dir_home, 'coingecko.json'), 'utf8')
		return JSON.parse(file)
	} catch (err) {
		try {
			await fs.access(path.join(dir_home, 'coingecko.json'))
		} catch {
			console.log('File does not exist yet')
			writeOnDisk()
			return tokensList
		}
		console.error(err)
	}
}

async function writeOnDisk() {
	console.log('Write a file')
	try {
		const file = await fs.writeFile(path.join(dir_home, 'coingecko.json'), JSON.stringify(tokensList))
	} catch (err) {
		console.error(err)
	}
}



async function fetchPrices() {
	let randomItems = getRandomItemsFromArray(tokensList, PER_PAGE).map((item) => item.id)
	let parameter = '&ids=' + randomItems.join()
	let data = await fetch(URL_FETCH_PRICES + parameter)
	let json = await data.json()


	return json.map((token) => {
		return {
			id: token.id,
			price: token.current_price,
			logo: token.image
		}
	})
}





function logByProtocol(protocol, index, array) {
	console.log(`${filterByProtocol(tokensList, protocol).length} items on ${protocol}`)
}


function filterByProtocol(list, protocol) {
	return list.filter((token) => Object.keys(token.platforms).some((platform) => platform === protocol))
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
