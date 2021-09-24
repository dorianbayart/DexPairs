'use strict'


let underlyingAssets = {}

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


// AAVE - Ethereum
const aave_ethereum_request = `
query
{
  atokens {
    id
    underlyingAssetAddress
  }
  vtokens {
    id
    underlyingAssetAddress
  }
  stokens {
    id
    underlyingAssetAddress
  }
}
`
// Use TheGraph API - https://thegraph.com/legacy-explorer/subgraph/aave/protocol-v2
async function callAaveEthereumUnderlyingAddresses() {
	return await get('https://api.thegraph.com/subgraphs/name/aave/protocol-v2', aave_ethereum_request)
}


// Compound - Ethereum
const compound_ethereum_request = `
query
{
  markets {
    id
    underlyingAddress
    exchangeRate
  }
}
`
// Use TheGraph API - https://thegraph.com/legacy-explorer/subgraph/graphprotocol/compound-v2
async function callCompoundEthereumUnderlyingAddresses() {
	return await get('https://api.thegraph.com/subgraphs/name/graphprotocol/compound-v2', compound_ethereum_request)
}




// AAVE - Polygon
const aave_polygon_request = `
query
{
  atokens {
    id
    underlyingAssetAddress
  }
  vtokens {
    id
    underlyingAssetAddress
  }
  stokens {
    id
    underlyingAssetAddress
  }
}
`
// Use TheGraph API - https://thegraph.com/legacy-explorer/subgraph/aave/aave-v2-matic
async function callAavePolygonUnderlyingAddresses() {
	return await get('https://api.thegraph.com/subgraphs/name/aave/aave-v2-matic', aave_polygon_request)
}



// Venus - BSC
const venus_bsc_request = `
query
{
  markets {
    id
    underlyingAddress
    exchangeRate
  }
}
`
// Use TheGraph API - https://thegraph.com/legacy-explorer/subgraph/venusprotocol/venus-subgraph
async function callVenusBscUnderlyingAddresses() {
	return await get('https://api.thegraph.com/subgraphs/name/venusprotocol/venus-subgraph', venus_bsc_request)
}




async function getAaveEthereumUnderlyingAddresses(callback) {
	let underlying = {}
	try {
		underlying = await callAaveEthereumUnderlyingAddresses()
	} catch(error) {
		setTimeout(getAaveEthereumUnderlyingAddresses, 3000)
		return
	}

	setTimeout(getAaveEthereumUnderlyingAddresses, 300000)

	underlying.data.atokens.forEach((item, i) => {
		underlyingAssets['ETHEREUM-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: 1
		}
	})
	underlying.data.vtokens.forEach((item, i) => {
		underlyingAssets['ETHEREUM-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: -1
		}
	})
	underlying.data.stokens.forEach((item, i) => {
		underlyingAssets['ETHEREUM-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: -1
		}
	})
}


async function getCompoundEthereumUnderlyingAddresses(callback) {
	let underlying = {}
	try {
		underlying = await callCompoundEthereumUnderlyingAddresses()
	} catch(error) {
		setTimeout(getCompoundEthereumUnderlyingAddresses, 3000)
		return
	}

	setTimeout(getCompoundEthereumUnderlyingAddresses, 300000)

	underlying.data.markets.forEach((item, i) => {
		underlyingAssets['ETHEREUM-' + item.id] = {
			address: item.underlyingAddress,
			rate: item.exchangeRate,
			debt: 1
		}
	})
}



async function getAavePolygonUnderlyingAddresses(callback) {
	let underlying = {}
	try {
		underlying = await callAavePolygonUnderlyingAddresses()
	} catch(error) {
		setTimeout(getAavePolygonUnderlyingAddresses, 3000)
		return
	}

	setTimeout(getAavePolygonUnderlyingAddresses, 300000)

	underlying.data.atokens.forEach((item, i) => {
		underlyingAssets['POLYGON-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: 1
		}
	})
	underlying.data.vtokens.forEach((item, i) => {
		underlyingAssets['POLYGON-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: -1
		}
	})
	underlying.data.stokens.forEach((item, i) => {
		underlyingAssets['POLYGON-' + item.id] = {
			address: item.underlyingAssetAddress,
			rate: 1,
			debt: -1
		}
	})
}



async function getVenusBscUnderlyingAddresses(callback) {
	let underlying = {}
	try {
		underlying = await callVenusBscUnderlyingAddresses()
	} catch(error) {
		setTimeout(getVenusBscUnderlyingAddresses, 3000)
		return
	}

	setTimeout(getVenusBscUnderlyingAddresses, 300000)

	underlying.data.markets.forEach((item, i) => {
		underlyingAssets['BSC-' + item.id] = {
			address: item.underlyingAddress,
			rate: item.exchangeRate,
			debt: 1
		}
	})
}
