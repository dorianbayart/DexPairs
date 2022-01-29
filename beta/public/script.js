'use strict'

let chartsForage, favoritesForage
let getListTimer, getTopTimer, getSimpleTimer, getFavoritesTimer
let list = {}
let search = ''
let filteredList = {}
let topTokens = {}
let favorites = {}
let simple = {}
let selectedToken = ''
let selectedBase = ''
let tokenCharts = {}
let baseCharts = {}
let myChart = null
let dex = 'UNISWAP'
let dexList = {
	UNISWAP: {
		name: 'Uniswap',
		chain: 'Ethereum',
		chain_enum: 'ETHEREUM',
		url: 'https://uniswap.org/',
		url_swap: 'https://app.uniswap.org/#/swap',
		url_data: SERVER_URL,
		explorer: 'https://etherscan.io/token/',
		tokens: {
			token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
			base: '0xdac17f958d2ee523a2206206994597c13d831ec7'
		}
	},
	QUICKSWAP: {
		name: 'QuickSwap',
		chain: 'Polygon/Matic',
		chain_enum: 'POLYGON',
		url: 'https://quickswap.exchange/',
		url_swap: 'https://quickswap.exchange/#/swap',
		url_data: SERVER_URL + '/quickswap',
		explorer: 'https://polygonscan.com/token/',
		tokens: {
			token: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
			base: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'
		}
	},
	PANCAKESWAP: {
		name: 'PancakeSwap',
		chain: 'Binance Smart Chain',
		chain_enum: 'BSC',
		url: 'https://pancakeswap.finance/',
		url_swap: 'https://exchange.pancakeswap.finance/#/swap',
		url_data: SERVER_URL + '/pancake',
		explorer: 'https://bscscan.com/token/',
		tokens: {
			token: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
			base: '0xe9e7cea3dedca5984780bafc599bd69add087d56'
		}
	},
	SPIRITSWAP: {
		name: 'SpiritSwap',
		chain: 'Fantom/Opera',
		chain_enum: 'FANTOM',
		url: 'https://www.spiritswap.finance/',
		url_swap: 'https://swap.spiritswap.finance/#/swap',
		url_data: SERVER_URL + '/spiritswap',
		explorer: 'https://ftmscan.com/token/',
		tokens: {
			token: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
			base: '0x04068da6c83afcfa0e13ba15a6696662335d5b75'
		}
	},
	HONEYSWAP: {
		name: 'HoneySwap',
		chain: 'xDai',
		chain_enum: 'XDAI',
		url: 'https://honeyswap.org/',
		url_swap: 'https://app.honeyswap.org/#/swap',
		url_data: SERVER_URL + '/honeyswap',
		explorer: 'https://blockscout.com/xdai/mainnet/tokens/',
		tokens: {
			token: '0x71850b7e9ee3f13ab46d67167341e4bdc905eef9',
			base: '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'
		}
	},
}

const INTERVAL_15M = '15m'
const INTERVAL_4H = '4h'
const INTERVAL_1D = '1d'
const INTERVAL_1W = '1w'
const TIMEFRAME_24H = '24h'
const TIMEFRAME_1W = '1w'
const TIMEFRAME_1M = '1m'
const TIMEFRAME_1Y = '1y'
const TIMEFRAME_ALL = 'all'
const LIST_INITIAL_SIZE = 100
let interval = INTERVAL_4H
let timeframe = TIMEFRAME_1W
let movingAverageSize = 12

const Y_AXIS_TYPES = {
	linear: 'linear',
	logarithmic: 'logarithmic'
}
let yAxisType = Y_AXIS_TYPES.linear


// get tokens list
// + put the list on the page
// + define events to update the main token when selected
function getList() {
	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			let data = JSON.parse(this.responseText)
			list = data
			if(list && Object.keys(list).length > 0) {
				updateList()
				sessionStorage.setItem('list', JSON.stringify(list))
			} else {
				clearTimeout(getListTimer)
				getListTimer = setTimeout(getList, 3000)
			}
		}
	}
	xmlhttp.open('GET', dexList[dex].url_data + '/list', true)
	xmlhttp.send()

	clearTimeout(getListTimer)
	getListTimer = setTimeout(getList, Math.round((90*Math.random() + 180)*1000))
}



// get top tokens from server
function getTop() {
	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			let data = JSON.parse(this.responseText)
			topTokens = data
			if(topTokens && Object.keys(topTokens).length > 0) {
				setTop()
				sessionStorage.setItem('topTokens', JSON.stringify(topTokens))
			} else {
				clearTimeout(getTopTimer)
				getTopTimer = setTimeout(getTop, 5000)
			}
		}
	}
	xmlhttp.open('GET', dexList[dex].url_data + '/top', true)
	xmlhttp.send()

	clearTimeout(getTopTimer)
	getTopTimer = setTimeout(getTop, Math.round((5*Math.random() + 15)*1000))
}



// get simple data from server
// + update main/base tokens with default ones
function getSimple() {
	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			let data = JSON.parse(this.responseText)
			simple = data
			if(simple && Object.keys(simple).length > 0) {

				if(selectedToken.length !== 42) {
					let found = findAddressFromSymbol(selectedToken)
					if(found) {
						selectedToken = found
					} else {
						selectedToken = dexList[dex].tokens.token
					}
				}

				if(selectedBase.length !== 42) {
					let found = findAddressFromSymbol(selectedBase)
					if(found) {
						selectedBase = found
					} else {
						selectedBase = dexList[dex].tokens.base
					}
				}

				setToken(selectedToken)
				setBase(selectedBase)
				getCharts()
				sessionStorage.setItem('simple', JSON.stringify(simple))
			} else {
				clearTimeout(getSimpleTimer)
				getSimpleTimer = setTimeout(getSimple, 4000)
			}
		}
	}
	xmlhttp.open('GET', dexList[dex].url_data + '/simple', true)
	xmlhttp.send()

	clearTimeout(getSimpleTimer)
	getSimpleTimer = setTimeout(getSimple, Math.round((30*Math.random() + 30)*1000))
}



// get charts data from server
// + update chart
async function getCharts() {
	let data = await getChartsByAddresses(selectedToken, selectedBase, dexList[dex].chain_enum)
	tokenCharts = data[selectedToken]
	baseCharts = data[selectedBase]
	if(tokenCharts && Object.keys(tokenCharts).length > 0) {
		updateCharts()
		setSwapperBase()
		sessionStorage.setItem('tokenCharts', JSON.stringify(tokenCharts))
		sessionStorage.setItem('baseCharts', JSON.stringify(baseCharts))
	} else {
		setTimeout(getCharts, 3000)
	}
}



// defines event on search field
document.getElementById('search_field').addEventListener('keyup', function(e) {
	search = e.target.value.toLowerCase()

	filteredList = {}
	Object.keys(list).forEach(function (address) {
		if(address.toLowerCase().includes(search) || simple[address].s.toLowerCase().includes(search) || simple[address].n.toLowerCase().includes(search)) {
			filteredList[address] = simple[address].s
		}
	})

	updateList()

	if(search.length > 0 && ALPHA_NUM.includes(e.key.toLowerCase())) {
		debounce(selectToken)(Object.keys(filteredList)[0])
	}
})

/* Select the token */
function selectToken(selected) {
	if(!selected || !simple[selected]) return

	selectedToken = selected
	setToken(selectedToken)
	getCharts()
	setSwapperToken()
	setSwapperBase()

	let listLi = document.getElementById('list_ul').querySelectorAll('li')
	listLi.forEach((li) => {
		li.classList.toggle('active', li.id === selectedToken)
	})
}



// set list from the list
function updateList() {
	if(Object.keys(list).length < 1) {
		return
	}

	let currentList = search.length > 0 ? filteredList : list

	const ul =document.getElementById('list_ul')
	ul.innerHTML = null

	const fullList = sessionStorage.getItem('full-list')
	const length = Object.keys(currentList).length > LIST_INITIAL_SIZE && !fullList ? LIST_INITIAL_SIZE : Object.keys(currentList).length
	for (let i = 0; i < length; i++) {
		let address = Object.keys(currentList)[i]
		let li = document.createElement('li')
		ul.appendChild(li)
		li.id = address
		li.innerHTML += currentList[address]
		li.classList.toggle('active', li.id === selectedToken)
	}

	if(!fullList && !document.getElementById('list-load-more') && Object.keys(currentList).length > LIST_INITIAL_SIZE) {
		const button = document.createElement('button')
		button.id = 'list-load-more'
		button.innerHTML = 'Load more'
		button.title = 'Display the full list'
		button.classList.add('load-more')
		document.getElementById('list_ul').parentElement.appendChild(button)
		button.addEventListener('click', function() {
			sessionStorage.setItem('full-list', true)
			updateList()
		})
	} else {
		const button = document.getElementById('list-load-more')
		if(button && fullList) {
			button.remove()
		}
	}

}

// set base list selection
function updateBaseList() {
	if(Object.keys(list).length < 1) {
		return
	}

	let currentList = list

	document.getElementById('base_select').innerHTML = null
	let select = document.getElementById('base_select')
	Object.keys(currentList).forEach(function (address) {
		let option = document.createElement('option')
		select.appendChild(option)
		option.innerHTML += currentList[address]
		option.value = address
		option.selected = address === selectedBase
	})
}


// set top tokens
function setTop() {
	if(Object.keys(topTokens).length < 1) {
		return
	}
	let top = document.getElementById('top')
	top.innerHTML = null
	for (let i = 0; i < 6; i++) {
		const address = Object.keys(topTokens)[i]
		const symbol = topTokens[address].s
		let div_column = document.createElement('div')
		div_column.classList.add('top-column')
		top.appendChild(div_column)

		let div = document.createElement('div')
		div.classList.add('top-token')
		div.id = address
		let img_logo = document.createElement('img')
		img_logo.src = 'https://raw.githubusercontent.com/dorianbayart/CryptoLogos/main/dist/' + dexList[dex].chain_enum.toLowerCase() + '/' + address + '.png'
		img_logo.width = '20'
		img_logo.height = '20'
		img_logo.classList.add('top-logo')
		div.appendChild(img_logo)
		let div_symbol = document.createElement('div')
		div_symbol.innerHTML = symbol
		div_symbol.classList.add('top-symbol')
		div.appendChild(div_symbol)
		let div_price = document.createElement('div')
		div_price.innerHTML = precise(topTokens[address].p)
		div_price.classList.add('top-price')
		div.appendChild(div_price)
		let div_percentage = document.createElement('div')
		div_percentage.classList.add('top-percentage')
		div_percentage.classList.add('color-transition')
		div.appendChild(div_percentage)
		let container_chart = document.createElement('div')
		container_chart.classList.add('top-chart')
		div.appendChild(container_chart)
		let canvas_chart = document.createElement('canvas')
		canvas_chart.id = 'chart_' + address
		container_chart.appendChild(canvas_chart)

		const miniChart = extract24hChart(topTokens[address].chart)
		const percentage = getPercentage24h(miniChart)
		div_percentage.innerHTML = percentage + '%'
		div_percentage.classList.add(percentage >= 0 ? 'green' : 'red')

		div_column.appendChild(div)

		setTopMiniChart(address, miniChart)

		div.addEventListener('click', function(e) {
			selectedToken = e.target.id && !e.target.id.includes('chart') ? e.target.id : e.target.parentElement.id
			selectToken(selectedToken)
		})

		img_logo.onerror = function() {
			this.onerror = null
			this.src = '/img/icons/empty.png'
			return true
		}
	}
}


async function updateFavorites() {
	getFavoritesTimer = setTimeout(updateFavorites, 8000)

	if(Object.keys(favorites).length < 1) {
		return
	}

	const favId = Object.keys(favorites).sort((favA, favB) => favorites[favA].updatedAt - favorites[favB].updatedAt)[0]
	const fav = favorites[favId]

	if((Date.now() - fav.updatedAt)/1000 > 80) {
		const charts = await getChartsByAddresses(fav.address, fav.base, fav.chain)
		if(!charts[fav.address] || !charts[fav.base]) {
			return
		}
		const lastPriceA = charts[fav.address].chart_often.slice(-1)[0].p
		const lastPriceB = charts[fav.base].chart_often.slice(-1)[0].p

		fav.price = lastPriceA / lastPriceB
		fav.chart = charts[fav.address].chart_often.map(coords => {
			const baseCoords = charts[fav.base].chart_often.find(base => base.t === coords.t)
			if(baseCoords) {
				return { t: coords.t, p: coords.p / baseCoords.p }
			}
			const price = estimatePriceInterpolation(charts[fav.base].chart_often, coords.t)
			return { t: coords.t, p: price ? coords.p / price : null }
		})
		fav.updatedAt = Date.now()
		favorites[favId] = fav

		setFavorites()
	}
}

// set favorites tokens
function setFavorites() {
	saveSessionVariables()
	setFavoriteIcon()

	let favHTML = document.getElementById('favorites')
	favHTML.innerHTML = null

	if(Object.keys(favorites).length < 1) {
		favHTML.classList.toggle('empty', true)
		return
	}

	favHTML.classList.remove('empty')

	Object.keys(favorites).forEach((favId) => {
		const fav = favorites[favId]

		let div_column = document.createElement('div')
		div_column.classList.add('favorite-column')
		favHTML.appendChild(div_column)

		let div = document.createElement('div')
		div.classList.add('favorite-token')
		div.id = favId
		let img_logo = document.createElement('img')
		img_logo.src = 'https://raw.githubusercontent.com/dorianbayart/CryptoLogos/main/dist/' + fav.chain.toLowerCase() + '/' + fav.address + '.png'
		img_logo.width = '20'
		img_logo.height = '20'
		img_logo.classList.add('favorite-logo')
		img_logo.title = fav.symbol
		div.appendChild(img_logo)

		let dash = document.createElement('span')
		dash.classList.add('favorite-dash')
		dash.innerHTML = '-'
		div.appendChild(dash)
		/*let div_symbol = document.createElement('div')
    div_symbol.innerHTML = fav.symbol
    div_symbol.classList.add('top-symbol')
    div.appendChild(div_symbol)*/
		img_logo = document.createElement('img')
		img_logo.src = 'https://raw.githubusercontent.com/dorianbayart/CryptoLogos/main/dist/' + fav.chain.toLowerCase() + '/' + fav.base + '.png'
		img_logo.width = '20'
		img_logo.height = '20'
		img_logo.classList.add('favorite-logo')
		img_logo.title = fav.baseSymbol
		div.appendChild(img_logo)
		/*div_symbol = document.createElement('div')
    div_symbol.innerHTML = fav.baseSymbol
    div_symbol.classList.add('top-symbol')
    div.appendChild(div_symbol)*/
		let div_price = document.createElement('div')
		div_price.innerHTML = precise(fav.price)
		div_price.classList.add('favorite-price')
		div.appendChild(div_price)
		let div_percentage = document.createElement('div')
		div_percentage.classList.add('favorite-percentage')
		div_percentage.classList.add('color-transition')
		div.appendChild(div_percentage)
		let container_chart = document.createElement('div')
		container_chart.classList.add('favorite-chart')
		div.appendChild(container_chart)
		let canvas_chart = document.createElement('canvas')
		canvas_chart.id = 'chart_' + favId
		container_chart.appendChild(canvas_chart)

		const miniChart = extract24hChart(fav.chart)
		const percentage = getPercentage24h(miniChart)
		div_percentage.innerHTML = percentage + '%'
		div_percentage.classList.add(percentage >= 0 ? 'green' : 'red')

		div_column.appendChild(div)

		setTopMiniChart(favId, miniChart)

		div.addEventListener('click', function(e) {
			let id = e.target.id && !e.target.id.includes('chart') ? e.target.id : e.target.parentElement.id
			setFromFavorite(id)
		})

		img_logo.onerror = function() {
			this.onerror = null
			this.src = '/img/icons/empty.png'
			return true
		}
	})
}

function setFromFavorite(id) {
	if(!id) {
		return
	}

	const chain = id.split('-')[0]
	selectedToken = id.split('-')[1]
	selectedBase = id.split('-')[2]
	let previousDex = dex
	dex = Object.keys(dexList).find(dex => dexList[dex].chain_enum === chain)
	let dexSelector = document.getElementById('dex-selector')
	dexSelector.querySelectorAll('option').forEach((option) => {
		option.selected = dexList[option.value].chain_enum === chain
	})
	const img = document.getElementById('dex-selection-img')
	img.src = NETWORK[dexList[dex].chain_enum].img
	img.alt = dexList[dex].chain + ' Logo'
	img.title = img.alt

	if(dex !== previousDex) {
		clearTimeout(getListTimer)
		clearTimeout(getSimpleTimer)
		clearTimeout(getTopTimer)
		getList()
		getSimple()
		getTop()
	} else {
		setBase(selectedBase)
		selectToken(selectedToken)
	}
}

function setTopMiniChart(addr, tokenChart) {
	const timeData = tokenChart.map(coords => new Date(coords.t))
	const tokenData = tokenChart.map(coords => coords.p)

	const ctx = document.getElementById('chart_' + addr).getContext('2d')
	new Chart(ctx, {
		type: 'line',
		data: {
			labels: timeData,
			datasets: [{
				data: tokenData,
				backgroundColor: '#0000FF88',
				borderColor: '#0000FF88',
				radius: 0,
				tension: 0.3,
				borderWidth: 1,
			}]
		},
		options: {
			plugins: {
				title: {
					display: false
				},
				legend: {
					display: false
				},
				tooltip: {
					enabled: false
				}
			},
			animation: false,
			responsive: true,
			maintainAspectRatio: false,
			//aspectRatio: 3,
			scaleShowLabels: false,
			tooltipEvents: [],
			pointDot: false,
			scaleShowGridLines: true,
			scales: {
				x: {
					type: 'time',
					display: false
				},
				y: {
					display: false
				}
			}
		}
	})
}


// set information of the main token
function setToken(addr) {
	if(Object.keys(simple).length < 1 || !simple[addr]) {
		return
	}
	const symbol = simple[addr].s

	const tokenLogo = document.getElementById('token_logo')
	tokenLogo.onerror = function() {
		this.onerror = null
		this.src = '/img/icons/empty.png'
		return true
	}
	tokenLogo.src = 'https://raw.githubusercontent.com/dorianbayart/CryptoLogos/main/dist/' + dexList[dex].chain_enum.toLowerCase() + '/' + addr + '.png'
	document.getElementById('token_symbol').innerHTML = symbol
	document.getElementById('token_name').innerHTML = simple[addr].n
	let address = addr.slice(0, 5) + '...' + addr.slice(-5)
	let a = document.createElement('a')
	a.href = dexList[dex].explorer + addr
	a.target = '_blank'
	a.textContent = address
	a.rel = 'noopener'
	document.getElementById('token_address').innerHTML = null
	document.getElementById('token_address').appendChild(a)
	document.getElementById('token_price').innerHTML = '$ ' + precise(simple[addr].p)

	setSwapperToken()
}

// set information of the base token
function setBase(addr) {
	if(Object.keys(simple).length < 1 || !simple[addr]) {
		return
	}
	const symbol = simple[addr].s

	const tokenLogo = document.getElementById('base_logo')
	tokenLogo.onerror = function() {
		this.onerror = null
		this.src = '/img/icons/empty.png'
		return true
	}
	tokenLogo.src = 'https://raw.githubusercontent.com/dorianbayart/CryptoLogos/main/dist/' + dexList[dex].chain_enum.toLowerCase() + '/' + addr + '.png'
	document.getElementById('base_symbol').innerHTML = symbol
	document.getElementById('base_name').innerHTML = simple[addr].n
	let address = addr.slice(0, 5) + '...' + addr.slice(-5)
	let a = document.createElement('a')
	a.href = dexList[dex].explorer + addr
	a.target = '_blank'
	a.textContent = address
	a.rel = 'noopener'
	document.getElementById('base_address').innerHTML = null
	document.getElementById('base_address').appendChild(a)
	document.getElementById('base_price').innerHTML = '$ ' + precise(simple[addr].p)
}

// Calculator fields
function setSwapperToken() {
	document.getElementById('swapper_token_symbol').innerHTML = simple[selectedToken].s
	document.getElementById('swapper_token').value = 1
}
function setSwapperBase() {
	document.getElementById('swapper_base_symbol').innerHTML = simple[selectedBase].s
	document.getElementById('swapper_base').value = precise(document.getElementById('swapper_token').value * simple[selectedToken].p / simple[selectedBase].p)
}




// OnChange on Dex Selector
document.getElementById('dex-selector').addEventListener(
	'change', function(e) {

		dex = e.target.value
		selectedToken = dexList[dex].tokens.token
		selectedBase = dexList[dex].tokens.base

		const img = document.getElementById('dex-selection-img')
		img.src = NETWORK[dexList[dex].chain_enum].img
		img.alt = dexList[dex].chain + ' Logo'

		const bodyBackground = document.getElementById('body-background')
		bodyBackground.style.backgroundImage = 'url(' + NETWORK[dexList[dex].chain_enum].img + ')'

		clearTimeout(getListTimer)
		clearTimeout(getSimpleTimer)
		clearTimeout(getTopTimer)

		getList()
		getSimple()
		getTop()

		setSourceDataText()
	}
)

// OnChange on Calculator [Selected/Base] => Update the other value
document.getElementById('swapper_token').addEventListener(
	'change', function() {
		document.getElementById('swapper_base').value =
    precise(document.getElementById('swapper_token').value
    * simple[selectedToken].p
    / simple[selectedBase].p)
	}
)

document.getElementById('swapper_base').addEventListener(
	'change', function() {
		document.getElementById('swapper_token').value =
    precise(document.getElementById('swapper_base').value
    / simple[selectedToken].p
    * simple[selectedBase].p)
	}
)

// OnClick on Edit Base token => Display the selection list
document.getElementById('base_change').addEventListener(
	'click', function() {
		updateBaseList()
		document.getElementById('base_symbol').style.display = 'none'
		document.getElementById('base_change').style.display = 'none'
		document.getElementById('base_select').style.display = 'flex'
	}
)
// OnChange on Base Selection => Update the Base Token + Chart
document.getElementById('base_select').addEventListener(
	'change', function(e) {
		document.getElementById('base_symbol').style.display = 'flex'
		document.getElementById('base_change').style.display = 'flex'
		document.getElementById('base_select').style.display = 'none'
		const selected = e.target.value
		if(selected === selectedToken) {
			selectedToken = selectedBase
			setToken(selectedToken)
		}
		selectedBase = selected

		setBase(selectedBase)
		getCharts()
		setSwapperToken()
		setSwapperBase()
	}
)


// Select a token from the list
document.getElementById('list_ul').addEventListener(
	'click', function(e) {
		selectToken(e.target.id)
	}
)

// OnClick on Favorite => Put this token in favorite list
document.getElementById('token_favorite').addEventListener(
	'click', function() {
		toggleFavorite(selectedToken, selectedBase)
	}
)

// Switch between Selected and Base tokens
document.getElementById('swapper_switch').addEventListener(
	'click', function() {
		const temp = selectedToken
		selectedToken = selectedBase
		selectedBase = temp
		setBase(selectedBase)
		selectToken(selectedToken)
	}
)

// Interval selection
document.getElementById('interval_15m').addEventListener(
	'click', function(e) {
		interval = INTERVAL_15M
		updateCharts()

		setActiveInterval(e.target)
	}
)
document.getElementById('interval_4h').addEventListener(
	'click', function(e) {
		interval = INTERVAL_4H
		updateCharts()

		setActiveInterval(e.target)
	}
)
document.getElementById('interval_1d').addEventListener(
	'click', function(e) {
		interval = INTERVAL_1D
		updateCharts()

		setActiveInterval(e.target)
	}
)
document.getElementById('interval_1w').addEventListener(
	'click', function(e) {
		interval = INTERVAL_1W
		updateCharts()

		setActiveInterval(e.target)
	}
)
// Set Active class on the clicked div
function setActiveInterval(item) {
	let list = document.getElementById('interval').querySelectorAll('div.interval-choice')
	list.forEach((div) => {
		div.classList.toggle('active', div.id === item.id || div.textContent === item.textContent)
	})
}

// Timeframe selection
document.getElementById('timeframe_24h').addEventListener(
	'click', function(e) {
		timeframe = TIMEFRAME_24H
		updateCharts()

		setActiveTimeframe(e.target)
	}
)
document.getElementById('timeframe_1w').addEventListener(
	'click', function(e) {
		timeframe = TIMEFRAME_1W
		updateCharts()

		setActiveTimeframe(e.target)
	}
)
document.getElementById('timeframe_1m').addEventListener(
	'click', function(e) {
		timeframe = TIMEFRAME_1M
		updateCharts()

		setActiveTimeframe(e.target)
	}
)
document.getElementById('timeframe_1y').addEventListener(
	'click', function(e) {
		timeframe = TIMEFRAME_1Y
		updateCharts()

		setActiveTimeframe(e.target)
	}
)
document.getElementById('timeframe_all').addEventListener(
	'click', function(e) {
		timeframe = TIMEFRAME_ALL
		updateCharts()

		setActiveTimeframe(e.target)
	}
)
// Set Active class on the clicked div
function setActiveTimeframe(item) {
	let list = document.getElementById('timeframe').querySelectorAll('div.timeframe-choice')
	list.forEach((div) => {
		div.classList.toggle('active', div.id === item.id || div.textContent === item.textContent)
	})
}

document.getElementById('log_choice').addEventListener(
	'click', function(e) {
		yAxisType = yAxisType === Y_AXIS_TYPES.linear ? Y_AXIS_TYPES.logarithmic : Y_AXIS_TYPES.linear
		myChart.options.scales.y.type = yAxisType
		updateCharts()
		e.target.classList.toggle('active', yAxisType === Y_AXIS_TYPES.logarithmic)
	}
)

// Share this chart - Button
document.getElementById('share_charts').addEventListener('click', () => {
	const location = window.location
	if (navigator.share) {
		navigator.share({
			title: location.hostname + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p),
			text: simple[selectedToken].s + ' price on ' + DOMAIN_NAME + ' | $' + precise(simple[selectedToken].p),
			url: window.location.href
		}).then(() => {
			console.log('Thanks for sharing!')
		})
			.catch(console.error)
	} else {
		console.log(location.hostname + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p))
	}
})




/* MAIN */
initializeHTML()
getList()
getSimple()
getTop()

updateFavorites()





function initializeHTML() {
	/* Initialize LocalForage */
	localforage.config({
		size: 15000000 // 15 MB
	})
	chartsForage = localforage.createInstance({
		name: 'charts'
	})
	favoritesForage = localforage.createInstance({
		name: 'favorites'
	})

	// default tokens
	selectedToken = dexList[dex].tokens.token
	selectedBase = dexList[dex].tokens.base

	if(sessionStorage.getItem('dex') && dexList[sessionStorage.getItem('dex')]) {
		dex = sessionStorage.getItem('dex')
		selectedToken = dexList[dex].tokens.token
		selectedBase = dexList[dex].tokens.base
	}
	if(sessionStorage.getItem('selectedToken')) {
		selectedToken = sessionStorage.getItem('selectedToken')
	}
	if(sessionStorage.getItem('selectedBase')) {
		selectedBase = sessionStorage.getItem('selectedBase')
	}
	if(sessionStorage.getItem('interval')) {
		interval = sessionStorage.getItem('interval')
	}
	if(sessionStorage.getItem('timeframe')) {
		timeframe = sessionStorage.getItem('timeframe')
	}
	favoritesForage.getItem('favorites')
		.then((favs) => {
			favorites = favs
			setFavorites()
		})
		.catch(() => {
			favorites = {}
		})


	if(sessionStorage.getItem('list')) {
		list = JSON.parse(sessionStorage.getItem('list'))
		if(list && Object.keys(list).length > 0) { updateList() }
		topTokens = JSON.parse(sessionStorage.getItem('topTokens'))
		if(topTokens && Object.keys(topTokens).length > 0) { setTop() }
		simple = JSON.parse(sessionStorage.getItem('simple'))
	}

	const params = new URLSearchParams(window.location.search)
	if(params.has('dex')) {
		dex = params.get('dex')
		selectedToken = dexList[dex].tokens.token
		selectedBase = dexList[dex].tokens.base
	}
	if(params.has('token')) {
		selectedToken = params.get('token')
	}
	if(params.has('base')) {
		selectedBase = params.get('base')
	}
	if(params.has('interval')) {
		interval = params.get('interval')
	}
	if(params.has('timeframe')) {
		timeframe = params.get('timeframe')
	}

	setActiveInterval({ textContent: interval })
	setActiveTimeframe({ textContent: timeframe })


	let dexSelector = document.getElementById('dex-selector')
	Object.keys(dexList).sort(sortDEXByChainId).filter(item => !dexList[item].disabled).forEach((item) => {
		let option = document.createElement('option')
		dexSelector.appendChild(option)
		option.innerHTML += dexList[item].chain + ' - ' + dexList[item].name
		option.value = item
		option.selected = dexList[item].name.toUpperCase() === dex
	})

	const img = document.getElementById('dex-selection-img')
	img.src = NETWORK[dexList[dex].chain_enum].img
	img.alt = dexList[dex].chain + ' Logo'

	const bodyBackground = document.getElementById('body-background')
	bodyBackground.style.backgroundImage = 'url(' + NETWORK[dexList[dex].chain_enum].img + ')'

	setSourceDataText()
}

function saveSessionVariables() {
	sessionStorage.setItem('dex', dex)
	sessionStorage.setItem('selectedToken', selectedToken)
	sessionStorage.setItem('selectedBase', selectedBase)
	sessionStorage.setItem('interval', interval)
	sessionStorage.setItem('timeframe', timeframe)

	favoritesForage.setItem('favorites', favorites)
		.then(() => {})
		.catch(() => {})

	updateURLParams()
}


// Update text indicating the source of data
function setSourceDataText() {
	let source_data = document.getElementById('source_data')
	source_data.innerHTML = null
	let a = document.createElement('a')
	a.href = NETWORK[dexList[dex].chain_enum].subgraph_url
	a.target = '_blank'
	a.innerHTML = 'Source: ' + dexList[dex].name + ' on ' + dexList[dex].chain + ' | TheGraph'
	a.title = 'Subgraph\'s playground of ' + dexList[dex].name + ' on ' + dexList[dex].chain
	source_data.appendChild(a)
}


function updateCharts() {
	saveSessionVariables()

	setFavoriteIcon()

	let tokenChart = null, baseChart = null, scaleUnit = 'day'
	let intervalMS = 0, timeframeMS = 0
	switch (interval) {
	case INTERVAL_15M:
		tokenChart = tokenCharts.chart_often
		baseChart = baseCharts.chart_often
		scaleUnit = 'hour'
		intervalMS = OFTEN
		break
	case INTERVAL_1D:
		tokenChart = tokenCharts.chart_1d
		baseChart = baseCharts.chart_1d
		scaleUnit = 'day'
		intervalMS = DAY
		break
	case INTERVAL_1W:
		tokenChart = tokenCharts.chart_1w
		baseChart = baseCharts.chart_1w
		scaleUnit = 'month'
		intervalMS = WEEK
		break
	case INTERVAL_4H:
	default:
		tokenChart = tokenCharts.chart_4h
		baseChart = baseCharts.chart_4h
		scaleUnit = 'day'
		intervalMS = HOURS
		break
	}
	switch(timeframe) {
	case TIMEFRAME_24H:
		timeframeMS = TIME_24H
		break
	case TIMEFRAME_1M:
		timeframeMS = TIME_1M
		break
	case TIMEFRAME_1Y:
		timeframeMS = TIME_1Y
		break
	case TIMEFRAME_ALL:
		timeframeMS = TIME_1Y
		break
	case TIMEFRAME_1W:
	default:
		timeframeMS = TIME_1W
		break
	}




	tokenChart = tokenChart.filter(dot => Date.now() - dot.t < timeframeMS + intervalMS)
	baseChart = baseChart.filter(dot => Date.now() - dot.t < timeframeMS + intervalMS)

	let timeData = tokenChart.map(coords => new Date(coords.t))
	let tokenData = tokenChart.map(coords => {
		const baseCoords = baseChart.find(base => base.t === coords.t)
		if(baseCoords) {
			return coords.p / baseCoords.p
		}
		const price = estimatePriceInterpolation(baseChart, coords.t)
		return price ? coords.p / price : null
	})


	let timeDataInterpolated = []
	for (let i = 0; intervalMS * i < Date.now() - tokenChart[0].t; i++) {
		timeDataInterpolated.unshift(new Date(tokenChart[tokenChart.length-1].t - intervalMS * i))
	}
	let tokenDataInterpolated = timeDataInterpolated.map(time => {
		const priceToken = estimatePriceInterpolation(tokenChart, time)
		const priceBase = estimatePriceInterpolation(baseChart, time)
		return priceToken / priceBase
	})


	let timeDataMA9 = [], tokenDataMA9 = []
	let size = 9
	for (let i = size - 1; i < timeDataInterpolated.length; i++) {
		timeDataMA9[i - size + 1] = timeDataInterpolated[i]
		tokenDataMA9[i - size + 1] = tokenDataInterpolated.slice(i - size + 1, i + 1).reduce((total, currentValue) => total + currentValue, 0) / size
	}
	let timeDataMA20 = [], tokenDataMA20 = []
	size = 20
	for (let i = size - 1; i < timeDataInterpolated.length; i++) {
		timeDataMA20[i - size + 1] = timeDataInterpolated[i]
		tokenDataMA20[i - size + 1] = tokenDataInterpolated.slice(i - size + 1, i + 1).reduce((total, currentValue) => total + currentValue, 0) / size
	}

	let timeDataMA = [], tokenDataMA = []
	size = movingAverageSize
	for (let i = size - 1; i < timeDataInterpolated.length; i++) {
		timeDataMA[i - size + 1] = timeDataInterpolated[i]
		tokenDataMA[i - size + 1] = tokenDataInterpolated.slice(i - size + 1, i + 1).reduce((total, currentValue) => total + currentValue, 0) / size
	}



	let ctx = document.getElementById('myChart').getContext('2d')
	if(myChart) {
		//myChart.data.labels = timeData
		myChart.data.datasets[0].label = simple[selectedToken].s + ' / ' + simple[selectedBase].s
		myChart.data.datasets[0].data = timeData.map(x => {return {x: x, y: tokenData[timeData.findIndex(t => t === x)]}})
		myChart.data.datasets[1].label = 'SMA 9'
		myChart.data.datasets[1].data = timeDataMA9.map(x => {return {x: x, y: tokenDataMA9[timeDataMA9.findIndex(t => t === x)]}})
		myChart.data.datasets[2].label = 'SMA 20'
		myChart.data.datasets[2].data = timeDataMA20.map(x => {return {x: x, y: tokenDataMA20[timeDataMA20.findIndex(t => t === x)]}})
		myChart.data.datasets[3].label = 'SMA ' + movingAverageSize
		myChart.data.datasets[3].data = timeDataMA.map(x => {return {x: x, y: tokenDataMA[timeDataMA.findIndex(t => t === x)]}})
		myChart.options.scales.x.time.unit = scaleUnit
		myChart.options.scales.y.title.text = simple[selectedBase].s
		myChart.update()
	} else {
		myChart = new Chart(ctx, {
			type: 'scatter',
			data: {
				//labels: timeData,
				datasets: [{
					label: simple[selectedToken].s + ' / ' + simple[selectedBase].s,
					data: timeData.map(x => {return {x: x, y: tokenData[timeData.findIndex(t => t === x)]}}),
					backgroundColor: '#0000FF88', // blue
					borderColor: '#0000FF88',
					radius: 0,
					tension: 0.3,
					showLine: true
				}, {
					label: 'SMA 9',
					data: timeDataMA9.map(x => {return {x: x, y: tokenDataMA9[timeDataMA9.findIndex(t => t === x)]}}),
					backgroundColor: '#CCCC0088', // yellow
					borderColor: '#CCCC0088',
					radius: 0,
					tension: 0.3,
					showLine: true,
					hidden: true
				}, {
					label: 'SMA 20',
					data: timeDataMA20.map(x => {return {x: x, y: tokenDataMA20[timeDataMA20.findIndex(t => t === x)]}}),
					backgroundColor: '#FF800088', // orange
					borderColor: '#FF800088',
					radius: 0,
					tension: 0.3,
					showLine: true
				}, {
					label: 'SMA ' + movingAverageSize,
					data: timeDataMA.map(x => {return {x: x, y: tokenDataMA[timeDataMA.findIndex(t => t === x)]}}),
					backgroundColor: '#CC00FF88', // violet
					borderColor: '#CC00FF88',
					radius: 0,
					tension: 0.3,
					showLine: true,
					hidden: true
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				aspectRatio: window.matchMedia( '(min-width: 600px)' ).matches ? 2.25 : 1.5,
				radius: 0,
				interaction: {
					mode: 'nearest'
				},
				scales: {
					x: {
						type: 'time',
						time: {
							unit: 'day'
						},
					},
					y: {
						type: yAxisType,
						title: {
							display: true,
							text: simple[selectedBase].s
						}
					}
				}
			}
		})
	}
}


// Add or Remove from Favorites
function toggleFavorite(selected, base) {
	const chain = dexList[dex].chain_enum
	const symbol = simple[selected].s
	const baseSymbol = simple[base].s
	const id = chain + '-' + selected + '-' + base
	if(!favorites[id]) {
		if(Object.keys(favorites).length < 6) {
			// let tokenChart = tokenCharts.chart_often
			let baseChart = baseCharts.chart_often

			let fav = {
				address: selected,
				symbol: symbol,
				chain: chain,
				base: base,
				baseSymbol: baseSymbol,
				price: simple[selected].p / simple[base].p,
				chart: tokenCharts.chart_often.map(coords => {
					const baseCoords = baseChart.find(base => base.t === coords.t)
					if(baseCoords) {
						return { t: coords.t, p: coords.p / baseCoords.p }
					}
					const price = estimatePriceInterpolation(baseChart, coords.t)
					return { t: coords.t, p: price ? coords.p / price : null }
				}),
				updatedAt: 0
			}
			favorites[id] = fav
		}
	} else {
		removeFromFavorite(id)
	}

	setFavorites()
}

function removeFromFavorite(id) {
	delete favorites[id]

	setFavorites()
}

// Add or Remove class on the Favorite icon
function setFavoriteIcon() {
	const icon = document.getElementById('token_favorite')
	const id = dexList[dex].chain_enum + '-' + selectedToken + '-' + selectedBase
	if(Object.keys(favorites).includes(id)) {
		icon.classList.toggle('active', true)
		icon.title = 'Remove from favorites'
	} else {
		icon.classList.remove('active')
		icon.title = 'Add to favorites'
	}
}


// useful
// Estimate a Price at a time T - find 2 points and calculate a linear interpolation
function estimatePriceInterpolation(chart, t) {
	let index = chart.findIndex(coords => coords.t >= t)
	if(index < 1) { return }
	// y3 = (x3-x1)*(y2-y1)/(x2-x1) + y1
	return (t-chart[index - 1].t)*(chart[index].p-chart[index - 1].p)/(chart[index].t-chart[index - 1].t) + chart[index - 1].p
}




// Utils
// Update URL with parameters
function updateURLParams() {
	const params = new URLSearchParams(window.location.search)
	params.set('dex', dex)
	params.set('token', selectedToken)
	params.set('base', selectedBase)
	params.set('interval', interval)
	params.set('timeframe', timeframe)

	if(simple[selectedToken]) {
		const fullTitle = DOMAIN_NAME + ' | ' + simple[selectedToken].s + ' | $' + precise(simple[selectedToken].p)
		document.title = fullTitle
		document.querySelector('meta[property="og:title"]').setAttribute('content', fullTitle)
		document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href)

		window.history.replaceState(null, fullTitle, window.location.href.split('?')[0] + '?' + params.toString())
	}
}



// useful
// Find Address From Symbol
function findAddressFromSymbol(symbol) {
	return Object.keys(simple).find(
		address => simple[address].s === symbol
	)
}
