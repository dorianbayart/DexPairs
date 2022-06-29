'use strict'

const COLOR_THEMES = {
	LIGHT_BLUE: {
		background_html: '#FFF',
		background_top: '#0002',
		background_color: '#FFFE',
		background_hover: '#0002', // li
		color: '#000D',
		chart_line: '#00F8', // blue
		links: '#00F8'
	},
	DARK_ORANGE: {
		background_html: '#000D',
		background_top: '#444C',
		background_hover: '#DDD4', // li
		background_inverted: '#BBB2', // img buttons
		background_color: '#333D',
		color: '#FFFB',
		chart_line: '#F90D', // orange
		links: '#F90D'
	}
}

/* Backend API url */
/* https://api.dexpairs.xyz or empty for localhost */
const DOMAIN_NAME = 'DexPairs.xyz'
const SERVER_URL = window.location.href.includes(DOMAIN_NAME.toLowerCase()) ? 'https://api.dexpairs.xyz' : ''

const ALPHA_NUM = 'abcdefghijklmnopqrstuvwxyz0123456789-'
const TIME_24H = 1000*60*60*24
const TIME_1W = 1000*60*60*24*7
const TIME_1M = 1000*60*60*24*30
const TIME_1Y = 1000*60*60*24*365

const OFTEN = 900000 // 15 minutes
const HOURS = 14400000 // 4 hours
const DAY = 86400000 // 1 day
const WEEK = 604800000 // 1 week


const NETWORK = {
	ETHEREUM: {
		chainId: 1,
		enum: 'ETHEREUM',
		name: 'Ethereum',
		shortName: 'eth',
		img: '/img/ethereum-icon.svg',
		color: '#3a3a39',
		rpc: 'https://cloudflare-eth.com',
		explorer: 'https://etherscan.io/token/',
		tokentx: 'https://api.etherscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: 'https://api.etherscan.io/api?module=account&action=tokennfttx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		tokenbalance: 'https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: SERVER_URL,
		tokenContract: '0x0',
		tokenSymbol: 'ETH',
		tokenName: 'Ethereum',
		tokenDecimal: 18,
		tokenPriceContract: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/uniswap/uniswap-v3',
		coingecko_name: 'ethereum'
	},
	CRONOS: {
		chainId: 25,
		enum: 'CRONOS',
		name: 'Cronos',
		shortName: 'cro',
		img: '/img/cronos-icon.svg',
		color: '#00296c',
		rpc: 'https://evm-cronos.crypto.org',
		explorer: 'https://cronos.crypto.org/explorer/token/',
		tokentx: 'https://cronos.crypto.org/explorer/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: null,
		tokenbalance: 'https://cronos.crypto.org/explorer/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: '',
		tokenContract: '0x0',
		tokenSymbol: 'CRO',
		tokenName: 'Crypto.org Coin',
		tokenDecimal: 18,
		tokenPriceContract: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
		subgraph_url: '',
		coingecko_name: 'cronos'
	},
	BSC : {
		chainId: 56,
		enum: 'BSC',
		name: 'Binance Smart Chain',
		shortName: 'bnb',
		img: '/img/bsc-icon.svg',
		color: '#f0b931',
		rpc: 'https://bsc-dataseed.binance.org',
		explorer: 'https://bscscan.com/token/',
		tokentx: 'https://api.bscscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: 'https://api.bscscan.com/api?module=account&action=tokennfttx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		tokenbalance: 'https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: SERVER_URL + '/pancake',
		tokenContract: '0x0',
		tokenSymbol: 'BNB',
		tokenName: 'BNB',
		tokenDecimal: 18,
		tokenPriceContract: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
		subgraph_url: 'https://bsc.streamingfast.io/subgraphs/name/pancakeswap/exchange-v2/graphql',
		coingecko_name: 'binance-smart-chain'
	},
	XDAI: {
		chainId: 100,
		enum: 'XDAI',
		name: 'Gnosis Chain (formerly xDai)',
		shortName: 'gno',
		img: '/img/xdai-icon.svg',
		color: '#4ea8a6',
		rpc: 'https://rpc.gnosischain.com',
		explorer: 'https://blockscout.com/xdai/mainnet/tokens/',
		tokentx: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: null,
		tokenbalance: 'https://blockscout.com/xdai/mainnet/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: SERVER_URL + '/honeyswap',
		tokenContract: '0x0',
		tokenSymbol: 'XDAI',
		tokenName: 'xDai',
		tokenDecimal: 18,
		tokenPriceContract: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/kirkins/honeyswap',
		coingecko_name: 'xdai'
	},
	POLYGON: {
		chainId: 137,
		enum: 'POLYGON',
		name: 'Polygon/Matic',
		shortName: 'MATIC',
		img: '/img/polygon-icon.svg',
		color: '#8249e5',
		rpc: 'https://polygon-rpc.com',
		explorer: 'https://polygonscan.com/token/',
		tokentx: 'https://api.polygonscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: 'https://api.polygonscan.com/api?module=account&action=tokennfttx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		tokenbalance: 'https://api.polygonscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: SERVER_URL + '/quickswap',
		tokenContract: '0x0',
		tokenSymbol: 'MATIC',
		tokenName: 'Matic',
		tokenDecimal: 18,
		tokenPriceContract: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/henrydapp/quickswap',
		coingecko_name: 'polygon-pos'
	},
	FANTOM: {
		chainId: 250,
		enum: 'FANTOM',
		name: 'Fantom Opera',
		shortName: 'ftm',
		img: '/img/fantom-icon.svg',
		color: '#1c68fb',
		rpc: 'https://rpcapi.fantom.network',
		explorer: 'https://ftmscan.com/token/',
		tokentx: 'https://api.ftmscan.com/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: 'https://api.ftmscan.com/api?module=account&action=tokennfttx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		tokenbalance: 'https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: SERVER_URL + '/spiritswap',
		tokenContract: '0x0',
		tokenSymbol: 'FTM',
		tokenName: 'Fantom',
		tokenDecimal: 18,
		tokenPriceContract: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/layer3org/spiritswap-analytics',
		coingecko_name: 'fantom'
	},
	ARBITRUM_ONE: {
		chainId: 42161,
		enum: 'ARBITRUM_ONE',
		name: 'Arbitrum One',
		shortName: 'arb1',
		img: '/img/arbitrum-icon.svg',
		color: '#3aa0f0',
		rpc: 'https://arb1.arbitrum.io/rpc',
		explorer: 'https://arbiscan.io/token/',
		tokentx: 'https://api.arbiscan.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: 'https://api.arbiscan.io/api?module=account&action=tokennfttx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		tokenbalance: 'https://api.arbiscan.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: '', // SERVER_URL + '/uniswap-arbitrum',
		tokenContract: '0x0',
		tokenSymbol: 'AETH',
		tokenName: 'Ether',
		tokenDecimal: 18,
		tokenPriceContract: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/ianlapham/arbitrum-minimal',
		coingecko_name: 'arbitrum-one'
	},
	CELO: {
		chainId: 42220,
		enum: 'CELO',
		name: 'Celo',
		shortName: 'CELO',
		img: '/img/celo-icon.svg',
		color: '#6ad181',
		rpc: 'https://forno.celo.org',
		explorer: 'https://explorer.celo.org/token/',
		tokentx: 'https://explorer.celo.org/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: null,
		tokenbalance: 'https://explorer.celo.org/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: '', // SERVER_URL + '/ubeswap',
		tokenContract: '0x0',
		tokenSymbol: 'CELO',
		tokenName: 'CELO',
		tokenDecimal: 18,
		tokenPriceContract: '0x471EcE3750Da237f93B8E339c536989b8978a438',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/ubeswap/ubeswap',
		coingecko_name: 'celo'
	},
	AVALANCHE: {
		chainId: 43114,
		enum: 'AVALANCHE',
		name: 'Avalanche',
		shortName: 'Avalanche',
		img: '/img/avalanche-icon.svg',
		color: '#e84142',
		rpc: 'https://api.avax.network/ext/bc/C/rpc',
		explorer: 'https://snowtrace.io/token/',
		tokentx: 'https://api.snowtrace.io/api?module=account&action=tokentx&address=WALLET_ADDRESS&startblock=START_BLOCK&sort=asc',
		erc721tx: null,
		tokenbalance: 'https://api.snowtrace.io/api?module=account&action=tokenbalance&contractaddress=CONTRACT_ADDRESS&address=WALLET_ADDRESS&tag=latest',
		url_data: '', // SERVER_URL + '/traderjoe',
		tokenContract: '0x0',
		tokenSymbol: 'AVAX',
		tokenName: 'Avalanche',
		tokenDecimal: 18,
		tokenPriceContract: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
		subgraph_url: 'https://thegraph.com/hosted-service/subgraph/traderjoe-xyz/exchange',
		coingecko_name: 'avalanche'
	},
}

const minABI = [
	// balanceOf
	{
		'constant':true,
		'inputs':[{'name':'_owner','type':'address'}],
		'name':'balanceOf',
		'outputs':[{'name':'balance','type':'uint256'}],
		'type':'function'
	},
	// decimals
	{
		'constant':true,
		'inputs':[],
		'name':'decimals',
		'outputs':[{'name':'','type':'uint8'}],
		'type':'function'
	}
]

const nftABI = [
	// balanceOf
	{
		'constant':true,
		'inputs':[{'name':'_owner','type':'address'}],
		'name':'balanceOf',
		'outputs':[{'name':'balance','type':'uint256'}],
		'type':'function'
	},
	// decimals
	{
		'constant':true,
		'inputs':[],
		'name':'decimals',
		'outputs':[{'name':'','type':'uint8'}],
		'type':'function'
	},
	// tokenURI
	{
		'constant':true,
		'inputs':[{'name':'_tokenId','type':'uint256'}],
		'name':'tokenURI',
		'outputs':[{'name':'','type':'string'}],
		'type':'function'
	},
	// tokenOfOwnerByIndex
	{
		'constant':true,
		'inputs':[{'name':'_owner','type':'address'}, {'name':'_index','type':'uint256'}],
		'name':'tokenOfOwnerByIndex',
		'outputs':[{'name':'tokenId','type':'uint256'}],
		'type':'function'
	}
]


let web3 = null
let walletAddress = []
let wallet = {}
let wallet_NFT = {}

let gasIsRealtime = false
let loadingChartsByAddress = false



document.addEventListener('DOMContentLoaded', function() {
	web3 = {}

	Object.keys(NETWORK).sort(sortByChainId).forEach((network) => {
		web3[network] = new Web3(NETWORK[network].rpc)
		setGas(network)
	})

	setTimeout(updateGas, 5000)
})


const updateGas = (network) => {
	if(!network) {
		// randomly select a network to update gas
		network = Object.keys(NETWORK)[Math.floor(Object.keys(NETWORK).length * Math.random())]
		setTimeout(updateGas, gasIsRealtime ? 750 : 5000)
	}

	let web3 = getWeb3(network)
	if(web3) {
		try {
			web3.eth.getGasPrice().then(gas => {
				const gwei = gasRound(web3.utils.fromWei(gas, 'gwei'))
				const li = document.getElementById(`gas-${network}`)
				const span = document.getElementById(`gas-value-${network}`)
				span.innerHTML = gwei
				li.title = gwei + ' gwei' + (gwei > 1 ? 's' : '') + ' on ' + NETWORK[network].name
			}, error => {})
		} catch {}
	}
}

const setGas = (network) => {
	const ul = document.getElementById('gas-list')
	const li = document.createElement('li')
	li.id = `gas-${network}`
	li.innerHTML = ''
	let span = document.createElement('span')
	span.classList.add('gas-network')
	span.appendChild(createNetworkImg(network))
	li.appendChild(span)
	span = document.createElement('span')
	span.classList.add('gas-value')
	span.id = `gas-value-${network}`
	li.appendChild(span)
	ul.appendChild(li)

	updateGas(network)
}





// get simple data prices
// param: network, callback function
function getSimpleData(network, callback) {
	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			const simple = JSON.parse(this.responseText)
			if(simple && Object.keys(simple).length > 0) {
				NETWORK[network].simple_data = JSON.stringify(simple)

				if (callback && typeof callback === 'function') {
					callback()
				}
			}
		}
	}
	xmlhttp.onerror = function() {
		// console.log('getSimpleData', this)
	}
	xmlhttp.open('GET', NETWORK[network].url_data + '/simple', true)
	xmlhttp.send()
}


// get charts by address and network
// params: address, network, callback function
function getChartsByAddress(address, network, callback) {
	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			const charts = JSON.parse(this.responseText)
			if(charts && Object.keys(charts).length > 0) {
				loadingChartsByAddress = false
				sessionStorage.setItem(network + '-' + address, JSON.stringify(charts))
				sessionStorage.setItem(network + '-' + address + '-lastFetch', new Date().getTime())

				if (callback && typeof callback === 'function') {
					callback()
				}
			}
		}
	}
	xmlhttp.onerror = function() {
		// console.log('getChartsByAddress', this)
	}
	xmlhttp.open('GET', NETWORK[network].url_data + '/charts/' + address, true)
	xmlhttp.send()
	loadingChartsByAddress = true
}


// get charts by address and network
// params: address, network, callback function
async function getChartsByAddresses(tokenA, tokenB, network) {
	return new Promise((resolve, reject) => {
		fetch(NETWORK[network].url_data + '/charts/' + tokenA + '/' + tokenB)
			.then((response) => response.json())
			.then(resolve)
			.catch(reject)
	})
}



document.getElementById('gas-realtime-button').addEventListener('click', (e) => {
	gasIsRealtime = !gasIsRealtime
	let element = e.target.id ? e.target : e.target.parentElement
	element.classList.toggle('active', gasIsRealtime)
})




/* Utils - Return the web3 to use depending on the network */
const getWeb3 = (network) => {
	return web3[network]
}



/* Utils - Create a document network img tag */
const createNetworkImg = (network) => {
	let img = document.createElement('img')
	img.src = NETWORK[network].img
	img.width = '24'
	img.height = '24'
	img.alt = NETWORK[network].name + ' logo'
	img.title = NETWORK[network].name
	img.classList.add('network')
	return img
}


/* Utils - Get Price of Address on Network */
const getPriceByAddressNetwork = async (searchedAddress, balance, network) => {
	let address = searchedAddress
	let debt = 1
	let rate = 1
	if(Object.keys(underlyingAssets).includes(network + '-' + searchedAddress)) {
		address = underlyingAssets[network + '-' + searchedAddress].address
		rate = underlyingAssets[network + '-' + searchedAddress].rate
		debt = underlyingAssets[network + '-' + searchedAddress].debt
	}
	let prices = NETWORK[network].simple_data ? JSON.parse(NETWORK[network].simple_data) : null
	if(prices && prices[address] && prices[address].p > 0 && (Date.now() - prices[address].t < TIME_1W)) {
		return prices[address].p * debt * rate
	}

	if(balance > 0) {
		return await getCoingeckoPrice(address, network)
	}

	return null
}



/* Calculate percentage change of last 24h */
function getPercentage24h(chart) {
	const chart24h = extract24hChart(chart)
	const first = chart24h[0]
	const last = chart24h[chart24h.length - 1]
	// round with 2 digits after commma
	return Math.round((last.p - first.p) / first.p * 10000) / 100
}

/* Return only last 24h data from a chart */
function extract24hChart(chart) {
	return extractChartByDuration(chart, TIME_24H)
}

/* Return only last data from a chart */
/* Params: chart, duration */
function extractChartByDuration(chart, duration) {
	const last_t = chart[chart.length-1].t
	return chart.filter(({t}) => last_t-t <= duration)
}



/* Utils - Debounce function */
let debounceTimer
function debounce(func, timeout = 500) {
	return (...args) => {
		clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => { func.apply(this, args) }, timeout)
	}
}


// Round number
const precise = (x) => {
	if(Math.abs(x) > 999) { return Math.round(x) }
	else if(Math.abs(x) > 99) { return Math.round(10*x)/10 }
	else if(Math.abs(x) > 1.09) { return Math.round(100*x)/100 }
	else if(Math.abs(x) > 0.001) { return Math.round(10000*x)/10000 }
	return Number.parseFloat(x).toPrecision(2)
}
const gasRound = (x) => {
	if(x > 9) { return Math.round(x) }
	return Math.round(10 * x) / 10
}



// Build a Color from String
const hashCode = (str) => {
	let hash = 0
	for (var i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash)
	}
	return hash
}
const getColorFromString = (str) => {
	return `hsl(${hashCode(str) % 360}, 100%, 45%)`
}


// Sort By ChainId
const sortByChainId = (a, b) => {
	if(NETWORK[a].chainId > NETWORK[b].chainId) return 1
	return -1
}
const sortDEXByChainId = (a, b) => {
	if(NETWORK[dexList[a].chain_enum].chainId > NETWORK[dexList[b].chain_enum].chainId) return 1
	return -1
}
