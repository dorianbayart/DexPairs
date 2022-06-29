'use strict'

let walletForage = null
let globalChart = null
let pieCharts = {}
let walletValue = 0
let loading = false
let txDisplay = {
	hasMore: false,
	limit: 50,
	step: 50,
	scrollEventAdded: false
}
let coingecko = []
let displayWalletTimer = null
let tokentx = {}
let erc721tx = {}
let timerGetTokenTx = {}
let timerSearchTokens = {}
let timerGetERC721Tx = {}
let timerPopulateNFTs = {}
let timerGetNetworkBalance = {}
let timerGetTransactions = {}

let timerBuildWallet = null
let timerFetchTokenTx = {}
let timerFetchErc721Tx = {}

let filters = {
	address: [],
	networks: [],
	search: '',
	addressEventAdded: false
}
let walletOptions = {
	menu: {
		tokens: {
			name: 'Tokens',
			hash: '#tokens',
			isActive: true
		},
		nfts: {
			name: 'NFTs',
			hash: '#nfts',
			isActive: false
		},
		transactions: {
			name: 'Transactions',
			hash: '#transactions',
			isActive: false
		}
	},
	hideSmallBalance: true,
	smallBalance: 0.01,
	hideNoImage: true
}



// defines event on search field
document.getElementById('input-wallet').addEventListener('change', function(e) {
	let inputAddress = e.target.value.replace(/\s/g, '').split(',')
	configureWallet(inputAddress)
})

document.getElementById('connect-wallet').addEventListener('click', function() {
	if (window.ethereum) {
		window.ethereum.request({ method: 'eth_requestAccounts' }).then(addresses => {
			document.getElementById('input-wallet').value = addresses
			configureWallet(addresses)
		})
	} else {
		alert('Connection is only supported through Metamask extension')
	}
})


function clearAllTimers() {
	Object.keys(timerGetTokenTx).forEach(network => {
		Object.keys(timerGetTokenTx[network]).forEach(address => {
			clearTimeoutIf(timerGetTokenTx, network, address)
		})
	})
	Object.keys(timerSearchTokens).forEach(network => {
		Object.keys(timerSearchTokens[network]).forEach(address => {
			clearTimeoutIf(timerSearchTokens, network, address)
		})
	})
	Object.keys(timerGetERC721Tx).forEach(network => {
		Object.keys(timerGetERC721Tx[network]).forEach(address => {
			clearTimeoutIf(timerGetERC721Tx, network, address)
		})
	})
	Object.keys(timerPopulateNFTs).forEach(network => {
		Object.keys(timerPopulateNFTs[network]).forEach(address => {
			clearTimeoutIf(timerPopulateNFTs, network, address)
		})
	})
	Object.keys(timerGetNetworkBalance).forEach(network => {
		Object.keys(timerGetNetworkBalance[network]).forEach(address => {
			clearTimeoutIf(timerGetNetworkBalance, network, address)
		})
	})
	Object.keys(timerGetTransactions).forEach(network => {
		Object.keys(timerGetTransactions[network]).forEach(address => {
			clearTimeoutIf(timerGetTransactions, network, address)
		})
	})
}

// search transactions / tokens for the specified wallet address
function configureWallet(inputAddress) {
	const inputContainer = document.getElementById('input-wallet-container')
	const globalInformationContainer = document.getElementById('global')
	const stateContainer = document.getElementById('state')
	const connectDemoContainer = document.getElementById('connect-demo-container')
	const walletOptionsContainer = document.getElementById('wallet-options')

	clearAllTimers()

	if(inputAddress.length === 0 || walletAddress && inputAddress.length > 0 && inputAddress === walletAddress.join(',')) {
		stateContainer.innerHTML = null
		stateContainer.classList.remove('shadow-white')

		inputContainer.classList.toggle('margin-top', true)
		globalInformationContainer.classList.toggle('none', true)
		connectDemoContainer.classList.toggle('none', true)
		walletOptionsContainer.classList.remove('none')

		const urlParams = new URLSearchParams(window.location.search)
		if(urlParams.has('address') && window.history.replaceState) {
			window.history.replaceState(null, DOMAIN_NAME + ' | Wallet', window.location.href.split('?')[0])
			document.querySelector('meta[property="og:title"]').setAttribute('content', DOMAIN_NAME + ' | Wallet')
		}

		walletAddress = null
		sessionStorage.removeItem('walletAddress')
		wallet = {}
		wallet_NFT = {}
		loading = false
		displayWallet(true)

		walletOptionsContainer.classList.toggle('none', true)
		configureFilterByAddress()

		return
	}

	if(!web3) {
		setTimeout(() => configureWallet(inputAddress), 1000)
		return
	}

	let validAddresses = []
	inputAddress.forEach((address) => {
		if(getWeb3(NETWORK.ETHEREUM.enum).utils.isAddress(unprefixAddress(address))) {
			validAddresses.push(address)
		}
	})


	if(validAddresses.length === 0) {
		inputContainer.classList.toggle('margin-top', true)
		globalInformationContainer.classList.toggle('none', true)

		const urlParams = new URLSearchParams(window.location.search)
		if(urlParams.has('address') && window.history.replaceState) {
			window.history.replaceState(null, DOMAIN_NAME + ' | Wallet', window.location.href.split('?')[0])
			document.querySelector('meta[property="og:title"]').setAttribute('content', DOMAIN_NAME + ' | Wallet')
		}

		walletAddress = null
		sessionStorage.removeItem('walletAddress')
		wallet = {}
		wallet_NFT = {}
		loading = false
		displayWallet(true)

		stateContainer.innerHTML = 'No valid address, checksum cannot be verified'
		stateContainer.classList.toggle('shadow-white', true)
		walletOptionsContainer.classList.toggle('none', true)

		configureFilterByAddress()

		return
	}

	loading = true
	stateContainer.innerHTML = 'Searching for transactions and tokens ...'
	stateContainer.classList.toggle('shadow-white', true)
	walletOptionsContainer.classList.remove('none')

	if(sessionStorage.getItem('walletAddress') === validAddresses.join(',')) {
		wallet = sessionStorage.getItem('wallet') ? JSON.parse(sessionStorage.getItem('wallet')) : {}
		displayWallet(true)
	} else {
		sessionStorage.removeItem('wallet')
		wallet = {}
		wallet_NFT = {}
	}

	walletAddress = validAddresses

	const urlParams = new URLSearchParams(window.location.search)
	if(window.history.replaceState && (!urlParams.has('address') || urlParams.has('address') && urlParams.get('address') !== walletAddress.join(','))) {
		document.title = DOMAIN_NAME + ' | ' + walletAddress.join(',')
		window.history.replaceState(null, document.title, window.location.href.split('?')[0] + '?address=' + walletAddress.join(','))
		document.querySelector('meta[property="og:title"]').setAttribute('content', document.title)
	}

	Object.keys(NETWORK).forEach((network) => {
		timerGetTokenTx[network] = {}
		timerSearchTokens[network] = {}
		timerGetERC721Tx[network] = {}
		timerPopulateNFTs[network] = {}
		timerGetNetworkBalance[network] = {}
		timerGetTransactions[network] = {}
	})

	console.log('Configure Wallet', walletAddress)
	walletAddress.forEach((address) => {
		tokentx[address] = {}
		erc721tx[address] = {}
		wallet[address] = {}
		wallet_NFT[address] = {}

		getNetworksOfAddress(address).forEach((network) => {
			sessionStorage.removeItem('latest-block-' + address + '-' + NETWORK[network].enum)
			sessionStorage.removeItem('latest-erc721-block-' + address + '-' + NETWORK[network].enum)
			sessionStorage.removeItem('latest-fetched-block-' + address + '-' + NETWORK[network].enum)
			sessionStorage.removeItem('latest-fetched-erc721-block-' + address + '-' + NETWORK[network].enum)
			tokentx[address][network] = []
			erc721tx[address][network] = []
			if(walletOptions.menu.tokens.isActive) {
				clearTimeoutIf(timerGetNetworkBalance, network, address)
				clearTimeoutIf(timerGetERC721Tx, network, address)
				clearTimeoutIf(timerGetTransactions, network, address)
				getNetworkBalance(NETWORK[network].enum, address)
				getTokenTx(NETWORK[network].enum, address, searchTokens)
			} else if(walletOptions.menu.nfts.isActive) {
				clearTimeoutIf(timerGetTokenTx, network, address)
				clearTimeoutIf(timerGetTransactions, network, address)
				getERC721Tx(NETWORK[network].enum, address, searchNFTs)
			} else if(walletOptions.menu.transactions.isActive) {
				clearTimeoutIf(timerGetTokenTx, network, address)
				clearTimeoutIf(timerGetNetworkBalance, network, address)
				clearTimeoutIf(timerGetERC721Tx, network, address)
				getTransactions(NETWORK[network].enum, address)
			}
		})
	})

	sessionStorage.setItem('walletAddress', walletAddress.join(','))


	configureFilterByAddress()
}


// Return networks depending on the prefix of the address
const getNetworksOfAddress = (address) => {
	return address.includes(':')
		? Object.keys(NETWORK).filter((network) => NETWORK[network].shortName.toLowerCase() === address.split(':')[0].toLowerCase())
		: Object.keys(NETWORK)
}



const configureFilterByAddress = () => {
	const addressList = document.getElementById('filter-by-address-list')
	addressList.innerHTML = null
	filters.address = walletAddress

	if(!walletAddress || walletAddress.length < 2) {
		document.getElementById('filter-by-address-container').classList.toggle('none', true)
		return
	}

	walletAddress.forEach((address) => {
		const li = document.createElement('li')
		li.id = 'filter-by-' + address
		li.classList.add('filter-by-address-item')
		const addr = document.createElement('div')
		addr.innerHTML = address.includes(':') ? address.split(':')[0]+':'+address.split(':')[1].slice(0, 6) : address.slice(0, 6)
		addr.classList.add('filter-by-address-text')
		li.appendChild(addr)

		const statusImg = document.createElement('img')
		statusImg.classList.add('filter-by-address-status', 'checked')
		statusImg.src = '/img/icons/check-circle.svg'
		statusImg.width = '12'
		statusImg.height = '12'
		li.appendChild(statusImg)

		addressList.appendChild(li)
	})

	if(!filters.addressEventAdded) {
		filters.addressEventAdded = true
		addressList.addEventListener('click', e => {
			if(!e.target) {
				return
			}
			let clicked
			if(e.target.nodeName === 'LI') {
				clicked = e.target
			} else if (e.target.parentNode.nodeName === 'LI') {
				clicked = e.target.parentNode
			}
			if(clicked) {
				const filter = clicked.id.split('-')[2]
				toggleAddressFilter(filter)
			}
		})
	}

	document.getElementById('filter-by-address-container').classList.remove('none')
}

const toggleAddressFilter = (address) => {
	const li = document.getElementById('filter-by-' + address)
	const imgStatus = li.getElementsByClassName('filter-by-address-status')[0]
	if(filters.address.includes(address)) {
		imgStatus.src = '/img/icons/x-circle.svg'
		imgStatus.classList.remove('checked')
		imgStatus.classList.add('unchecked')
		filters.address.splice(filters.address.indexOf(address), 1)
	} else {
		imgStatus.src = '/img/icons/check-circle.svg'
		imgStatus.classList.remove('unchecked')
		imgStatus.classList.add('checked')
		filters.address.push(address)
	}

	displayWallet(true)
}

// get token transactions list
function getTokenTx(network, address, callback) {

	if(timerGetTokenTx[network] && timerGetTokenTx[network][address]) {
		clearTimeoutIf(timerGetTokenTx, network, address)
	}
	if(!address) {
		clearAllTimers()
		return
	}

	timerGetTokenTx[network][address] = setTimeout(() => getTokenTx(network, address, callback), 180000)

	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if(this.response && this.response.includes('Max rate limit reached')) {
			clearTimeoutIf(timerGetTokenTx, network, address)
			timerGetTokenTx[network][address] = setTimeout(() => getTokenTx(network, address, callback), 2600)
			// console.log('Max rate limit reached, Relaunch later', network, address)
			return
		} else if (this.readyState == 4 && this.status == 200) {
			let data = JSON.parse(this.responseText)
			tokentx[address][network] = tokentx[address][network].concat(data.result)

			// console.log(network, address, tokentx[address][network])

			if(callback) {
				callback(network, address)
			}

			if(data.result && data.result.length > 0) {
				sessionStorage.setItem('latest-fetched-block-' + address + '-' + network, data.result[data.result.length - 1].blockNumber)
			}
		}
	}
	xmlhttp.onerror = function() {
		// console.log('getTokenTx', this)
	}
	const latestBlock = sessionStorage.getItem('latest-fetched-block-' + address + '-' + network) ? parseInt(sessionStorage.getItem('latest-fetched-block-' + address + '-' + network)) + 1 : 0
	xmlhttp.open('GET', NETWORK[network].tokentx.replace('WALLET_ADDRESS', unprefixAddress(address)).replace('START_BLOCK', latestBlock), true)
	xmlhttp.send()
}

// get ERC-721 (NFT) transactions list
function getERC721Tx(network, address, callback) {

	if(timerGetERC721Tx[network] && timerGetERC721Tx[network][address]) {
		clearTimeoutIf(timerGetERC721Tx, network, address)
	}
	if(!address) {
		clearAllTimers()
		return
	}
	if(!NETWORK[network].erc721tx) {
		return
	}

	timerGetERC721Tx[network][address] = setTimeout(() => getERC721Tx(network, address, callback), 100000)

	let xmlhttp = new XMLHttpRequest()
	xmlhttp.onreadystatechange = function() {
		if(this.response && this.response.includes('Max rate limit reached')) {
			clearTimeoutIf(timerGetERC721Tx, network, address)
			timerGetERC721Tx[network][address] = setTimeout(() => getERC721Tx(network, address, callback), 2600)
			return
		} else if (this.readyState == 4 && this.status == 200) {
			let data = JSON.parse(this.responseText)
			erc721tx[address][network] = erc721tx[address][network].concat(data.result)

			// console.log(network, address, erc721tx[address][network])

			if(callback) {
				callback(network, address)
			}

			if(data.result.length > 0) {
				sessionStorage.setItem('latest-fetched-erc721-block-' + address + '-' + network, data.result[data.result.length - 1].blockNumber)
			}

			return
		}
	}
	xmlhttp.onerror = function() {
		// console.log('getERC721Tx error', network)
	}

	// TODO Send transaction from only latest needed blocks !
	const latestBlock = sessionStorage.getItem('latest-fetched-erc721-block-' + address + '-' + network) ? parseInt(sessionStorage.getItem('latest-fetched-erc721-block-' + address + '-' + network)) + 1 : 0
	xmlhttp.open('GET', NETWORK[network].erc721tx.replace('WALLET_ADDRESS', unprefixAddress(address)).replace('START_BLOCK', latestBlock), true)
	xmlhttp.send()
}

async function getTransactions(network, address) {

	if(!address) {
		return
	}

	getTokenTx(network, address, displayWallet)
	setTimeout(() => getERC721Tx(network, address, displayWallet), 5200)

}

async function populateNFTContract(contractAddress, address, network) {
	const id = getId(contractAddress, network)
	const nftContract = getNFTContract(contractAddress, network)

	// Loop over each NFT hold on this Contract by the WalletAddress
	for (var i = 0; i < wallet_NFT[address][id].number; i++) {
		await nftContract.methods.tokenOfOwnerByIndex(unprefixAddress(address), i).call(async (error, indexId) => {
			if(error) { return }
			const t = wallet_NFT[address][id].tokens.find(token => token.id === indexId)
			if(t) {
				if(!t.image) {
					await readNFTMetadata(address, id, indexId, t.tokenURI)
				}
				return
			}
			await nftContract.methods.tokenURI(indexId).call(async (error, tokenURI) => {
				if(error) { return }
				let token = { id: indexId, tokenURI: tokenURI }
				if(tokenURI.includes('ipfs://')) {
					token.original_tokenURI = tokenURI
					token.tokenURI = 'https://ipfs.io/ipfs/' + tokenURI.slice(-tokenURI.length + 7)
				}

				wallet_NFT[address][id].tokens.push(token)
				await readNFTMetadata(address, id, indexId, token.tokenURI)
			})
		})
	}
}

async function readNFTMetadata(address, id, indexId, tokenURI) {
	if(tokenURI && tokenURI.includes('http')) {
		await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(tokenURI)}`)
			.then(res => res.json())
			.then(json => {
				let data = JSON.parse(json.contents)
				wallet_NFT[address][id].tokens.find(token => token.id === indexId).metadata = data

				let url = ''
				if(data && data.nft) {
					data = data.nft
				} else if (data && data.data) {
					data = data.data
				} else if (data && data.result && data.result.data) {
					data = data.result.data
				}
				if (data && data.image_url) {
					url = data.image_url
				} else if (data && data.imageUrl) {
					url = data.imageUrl
				} else if (data && data.big_image) {
					url = data.big_image
				} else if (data && data.small_image) {
					url = data.small_image
				} else if (data && data.gif) {
					url = data.gif
				} else if (data && data.gif_url) {
					url = data.gif_url
				}

				if(data && data.image) {
					url = data.image
				}

				if(!url.includes('/')) {
					url = 'https://ipfs.io/ipfs/' + url
				}

				wallet_NFT[address][id].tokens.find(token => token.id === indexId).image = url
			})
			.catch(error => {
				wallet_NFT[address][id].tokens.find(token => token.id === indexId).image = tokenURI
			})
	}

}


async function searchTokens(network, address) {
	// console.log('searchTokens', network)
	let tx = tokentx[address][network].filter(t => t && !t.done)
	const latestBlock = parseInt(sessionStorage.getItem('latest-block-' + address + '-' + network))

	// Launch timer to update transactions
	clearTimeoutIf(timerGetTokenTx, network, address)
	timerGetTokenTx[network][address] = setTimeout(() => getTokenTx(network, address, searchTokens), 30000 * (tokentx[address][network].length > 0 ? 1 : 3))

	if(!wallet[address] || !tx || typeof tx === 'string' || (tx[0] && typeof tx[0] === 'string' && tx[0].includes('rate limit reached'))) {
		return
	}

	loading = true

	if(latestBlock) {
		//tx = tx.filter(tx => parseInt(tx.blockNumber) >= latestBlock)
	}

	// console.log('tokenLength', tx.length, network)

	if(tx.length > 0) {
		const transaction = tx[0]
		let balance = 0

		try {
			balance = await getTokenBalanceWeb3(transaction.contractAddress, address, network)
			const price = await getContractAddressPrice(transaction, network, balance)
			const id = getId(transaction.contractAddress, network)

			if(balance > 0 || (wallet[address] && wallet[address][id] && wallet[address][id].value > 0)) {
				wallet[address][id] = {
					network: network,
					contract: transaction.contractAddress,
					tokenSymbol: transaction.tokenSymbol,
					tokenName: transaction.tokenName,
					tokenDecimal: transaction.tokenDecimal,
					value: balance,
					price: price
				}
			}

			tokentx[address][network].filter(t => transaction.contractAddress === t.contractAddress && !t.done).forEach(t => t.done = true)
		} catch(error) {
			// console.error(address, network, transaction.contractAddress, error)
		}

		sessionStorage.setItem('latest-block-' + address + '-' + network, transaction.blockNumber)

		timerSearchTokens[network][address] = setTimeout(() => searchTokens(network, address), 75)
		if(balance > 0) {
			displayWallet(true)
		}

	} else {
		displayWallet()
		// console.log('searchTokens finished on ' + network)

		// Reset status of few random tx to update them
		tokentx[address][network].filter(t => t.done).forEach(t => {
			if(Math.random() < 0.1 / Math.log2(2 + tokentx[address][network].length)) {
				t.done = false
			}
		})
	}
}

async function getContractAddressPrice(transaction, network, balance = 1) {
	let price
	// beefy.finance
	if(transaction.tokenName.toLowerCase().startsWith('moo') && balance > 0) {
		price = await getPriceFromBeefy(transaction.contractAddress, transaction.tokenSymbol, balance, network)
		if(price) {
			return price
		}
	}
	return await getPriceByAddressNetwork(transaction.contractAddress, balance, network)
}

async function searchNFTs(network, address) {
	let tx = erc721tx[address][network].filter(t => t && !t.done)
	const latestBlock = parseInt(sessionStorage.getItem('latest-erc721-block-' + address + '-' + network))

	if(!wallet[address] || !tx || typeof tx === 'string') {
		return
	}

	loading = true

	if(latestBlock) {
		// tx = tx.filter(tx => parseInt(tx.blockNumber) >= latestBlock)
	}

	// console.log(network, address, tx)

	if(tx.length > 0) {
		const transaction = tx[0]
		try {
			const balance = await getTokenBalanceWeb3(transaction.contractAddress, address, network)
			const id = getId(transaction.contractAddress, network)

			if(balance > 0 || (wallet_NFT[address] && wallet_NFT[address][id] && wallet_NFT[address][id].number > 0)) {
				wallet_NFT[address][id] = {
					network: network,
					contract: transaction.contractAddress,
					tokens: [],
					number: balance,
					tokenSymbol: transaction.tokenSymbol,
					tokenName: transaction.tokenName,
					tokenDecimal: transaction.tokenDecimal
				}
			}

			erc721tx[address][network].filter(t => t && transaction.contractAddress === t.contractAddress && !t.done).forEach((t) => t.done = true)
		} catch(error) {
			// console.log(network, transaction.contractAddress, error)
		}
		sessionStorage.setItem('latest-erc721-block-' + address + '-' + network, transaction.blockNumber)

		setTimeout(() => searchNFTs(network, address), 40)
	} else {
		populateNFTs(network, address)
	}
}

async function populateNFTs(network, address) {
	const id = Object.keys(wallet_NFT[address]).find(
		id =>
			wallet_NFT[address][id].network === network &&
			(
				wallet_NFT[address][id].tokens.length < wallet_NFT[address][id].number ||
				(wallet_NFT[address][id].error && wallet_NFT[address][id].error.errorNumber < 10) ||
				wallet_NFT[address][id].tokens.some(token => token.tokenURI === undefined/* || token.error*/)
			)
	)

	if(!id || !wallet_NFT[address] || !wallet_NFT[address][id]) {
		displayWallet()
		// console.log('populateNFTs finished on ' + network + ' for ' + address)
		return
	}

	const nftContract = getNFTContract(wallet_NFT[address][id].contract, network)

	if(wallet_NFT[address][id].tokens.length < wallet_NFT[address][id].number) {
		const index = wallet_NFT[address][id].tokens.length
		try {
			const indexId = await getTokenId(address, nftContract, index)
			wallet_NFT[address][id].tokens.push({ id: indexId })
		} catch(error) {
			// console.log(network, wallet_NFT[address][id].tokenName, error)
		}
	} else {
		const token = wallet_NFT[address][id].tokens.find(item => item.tokenURI === undefined/* || item.error*/)
		const indexId = token.id
		try {
			let metadata = await getTokenURI(nftContract, indexId)
			if(metadata.tokenURI === '') {
				// second try
				metadata = await getTokenURI(nftContract, indexId)
			}
			Object.assign(wallet_NFT[address][id].tokens.find(token => token.id === indexId), metadata)
			await readNFTMetadata(address, id, indexId, metadata.tokenURI)
		} catch(error) {
			// console.log(error)
			Object.assign(wallet_NFT[address][id].tokens.find(token => token.id === indexId), error)
		}
	}

	displayWallet()
	clearTimeoutIf(timerPopulateNFTs, network, address)
	timerPopulateNFTs[network][address] = setTimeout(() => populateNFTs(network, address), 80)
}

async function getTokenId(address, nftContract, index) {
	try {
		return await nftContract.methods.tokenOfOwnerByIndex(unprefixAddress(address), index).call(async (error, indexId) => {
			return indexId
		})
	} catch(error) {
		if(error.includes('header not found')) {
			return 'error'
		} else {
			return
		}
	}
}

async function getTokenURI(nftContract, indexId) {
	try {
		const tokenURI = await nftContract.methods.tokenURI(indexId).call((error, tokenURI) => {
			return tokenURI
		})
		let token = { tokenURI: tokenURI }
		if(tokenURI && tokenURI.includes('ipfs://')) {
			token.original_tokenURI = tokenURI
			token.tokenURI = 'https://ipfs.io/ipfs/' + tokenURI.slice(-tokenURI.length + 7)
		}
		return token
	} catch(error) {
		console.log(nftContract._address, indexId, JSON.stringify(error))
		if(JSON.stringify(error).includes('header not found')) {
			return { tokenURI: '' }
		} else {
			return { error: JSON.stringify(error) }
		}
	}
}


async function getNetworkBalance(network, address) {
	const web3 = getWeb3(network)
	if(!web3 || !address || !web3.utils.isAddress(unprefixAddress(address))) {
		return
	}

	const tokenContract = NETWORK[network].tokenContract
	const id = getId(tokenContract, network)
	let sessionWallet = JSON.parse(sessionStorage.getItem('wallet'))
	if(sessionWallet && sessionWallet[address] && sessionWallet[id]) {
		wallet[address][id] = sessionWallet[address][id]
	} else {
		wallet[address][id] = {
			network: network,
			contract: tokenContract,
			tokenSymbol: NETWORK[network].tokenSymbol,
			tokenName: NETWORK[network].tokenName,
			tokenDecimal: NETWORK[network].tokenDecimal
		}
	}
	wallet[address][id].price = await getPriceByAddressNetwork(NETWORK[network].tokenPriceContract, 1, network)


	web3.eth.getBalance(unprefixAddress(address)).then(balance => {
		if(balance) {
			wallet[address][id].value = balance
			displayWallet()
		}

		clearTimeoutIf(timerGetNetworkBalance, network, address)
		timerGetNetworkBalance[network][address] = setTimeout(() => getNetworkBalance(network, address), (Math.round(Math.random() * 15) + 25) * 1000)

	}, error => {
		// console.log('getNetworkBalance', network, error)
		clearTimeoutIf(timerGetNetworkBalance, network, address)
		timerGetNetworkBalance[network][address] = setTimeout(() => getNetworkBalance(network, address), 10000)
	})


}


function displayWallet(force = false) {
	// console.log('displayWallet', force)
	clearTimeout(displayWalletTimer)
	displayWalletTimer = setTimeout(function() {
		if(walletOptions.menu.tokens.isActive) {
			sessionStorage.setItem('wallet', JSON.stringify(wallet))
			displayTokens()
		} else if(walletOptions.menu.nfts.isActive) {
			sessionStorage.setItem('wallet-NFT', JSON.stringify(wallet_NFT))
			displayNFTs()
		} else if(walletOptions.menu.transactions.isActive) {
			displayTransactions()

			if(!txDisplay.scrollEventAdded) {
				txDisplay.scrollEventAdded = true
				window.addEventListener('scroll', () => {
					const {
						scrollTop,
						scrollHeight,
						clientHeight
					} = document.documentElement

					if (scrollTop + clientHeight >= scrollHeight - 250 && txDisplay.hasMore) {
						txDisplay.limit = txDisplay.limit + txDisplay.step
						txDisplay.hasMore = false
						displayWallet()
					}
				}, {
					passive: true
				})
			}
		}
		updateGlobalPrice()
		updateGlobalChart()
		updatePieCharts()
	}, force === true ? 50 : 500)
}

// Display Wallet Tokens
function displayTokens() {
	let listLi = document.getElementById('wallet').querySelectorAll('li')
	const tokens = filteredWallet().sort(sortWallet)

	if(listLi.length === 0 || listLi.length !== tokens.length || tokens.length === Object.keys(wallet_NFT).length) {
		document.getElementById('wallet').innerHTML = null
		if(tokens.length > 0) {
			let ul = document.createElement('ul')
			ul.id = 'wallet-ul'
			document.getElementById('wallet').appendChild(ul)
		}
		listLi = []
	}

	// console.log(tokens, listLi)

	tokens.forEach(function (token) {
		const id = getId(token.contract, token.network, token.wallet)
		let element = Array.from(listLi).find(el => el.id === id)

		if(element) {

			element.querySelector('span.price').innerHTML = token.price ? '$' + precise(token.price) : '-'
			element.querySelector('span.value').innerHTML = token.price ? displayValue(token.value, token.price, token.tokenDecimal) : '-'
			element.querySelector('span.balance').innerHTML = displayBalance(token.value, token.tokenDecimal)

		} else {

			let li = document.createElement('li')
			li.title = ''
			li.id = id

			let spanNetwork = document.createElement('span')
			spanNetwork.classList.add('network')
			spanNetwork.appendChild(createNetworkImg(token.network))
			li.appendChild(spanNetwork)

			let spanNameSymbol = document.createElement('span')
			spanNameSymbol.classList.add('nameSymbol')
			li.appendChild(spanNameSymbol)

			let spanSymbol = document.createElement('span')
			spanSymbol.innerHTML = token.tokenSymbol
			spanSymbol.classList.add('symbol')
			spanNameSymbol.appendChild(spanSymbol)
			let spanName = document.createElement('span')
			spanName.innerHTML = token.tokenName
			spanName.classList.add('name')
			spanNameSymbol.appendChild(spanName)

			let spanPrice = document.createElement('span')
			spanPrice.innerHTML = token.price ? '$' + precise(token.price) : '-'
			spanPrice.classList.add('price')
			li.appendChild(spanPrice)

			let spanValueBalance = document.createElement('span')
			spanValueBalance.classList.add('valueBalance')
			li.appendChild(spanValueBalance)

			let spanValue = document.createElement('span')
			spanValue.innerHTML = token.price ? displayValue(token.value, token.price, token.tokenDecimal) : '-'
			spanValue.classList.add('value')
			spanValueBalance.appendChild(spanValue)
			let spanBalance = document.createElement('span')
			spanBalance.innerHTML = displayBalance(token.value, token.tokenDecimal)
			spanBalance.classList.add('balance')
			spanValueBalance.appendChild(spanBalance)

			/*
				let spanAddress = document.createElement('span')
				spanAddress.innerHTML = wallet[address][id].contract
				spanAddress.classList.add('address')
				li.appendChild(spanAddress)

				let spanChart = document.createElement('span')
				spanChart.id = id + '-chart'
				spanChart.classList.add('chart')
				li.appendChild(spanChart)
				*/

			document.getElementById('wallet-ul').appendChild(li)

			/*li.addEventListener('click', function(e) {
				let item = e.target

				while(item.id.length < 1 || item.id.includes('chart')) {
				item = item.parentNode
			}

			// TODO Replace with : expandCollapseItem(item)
			if(item.classList.contains('expanded')) {
			item.classList.remove('expanded')
		} else {
		//item.classList.toggle('expanded', true)
	}
})*/

		}

	})

	if(tokens.length > 0) {
		document.getElementById('global').classList.remove('none')
		document.getElementById('pie-charts').classList.remove('none')
		document.getElementById('connect-demo-container').classList.toggle('none', true)
		document.getElementById('state').innerHTML = null
		document.getElementById('input-wallet-container').classList.remove('margin-top')
		document.getElementById('state').classList.remove('shadow-white')
	} else {
		document.getElementById('global').classList.toggle('none', true)
		document.getElementById('pie-charts').classList.toggle('none', true)
		document.getElementById('input-wallet-container').classList.toggle('margin-top', true)
		document.getElementById('connect-demo-container').classList.remove('none')
		const stateContainer = document.getElementById('state')
		if(walletAddress && walletAddress.length > 0) {
			stateContainer.innerHTML = 'No token can be found :('
			stateContainer.classList.toggle('shadow-white', true)
		} else {
			stateContainer.innerHTML = null
			stateContainer.classList.remove('shadow-white')
		}
	}
}

// Display Wallet NFTs
function displayNFTs() {
	let listLi = document.getElementById('wallet').querySelectorAll('li')
	const nftContracts = filteredNFTWallet().sort(sortNFTWallet)

	// console.log(nftContracts)

	const nftNumber = nftContracts.reduce((prev, curr) => prev + curr.tokens.length, 0)

	if(listLi.length === 0 || listLi.length !== nftNumber || nftNumber === filteredWallet().length) {
		document.getElementById('wallet').innerHTML = null
		if(nftContracts.length > 0) {
			let ul = document.createElement('ul')
			ul.id = 'wallet-ul'
			document.getElementById('wallet').appendChild(ul)
		}
		listLi = []
	}

	nftContracts.forEach(function (nftContract) {

		const nfts = nftContract.tokens.sort(sortNFTTokens)

		nfts.forEach(function (nft) {
			if(walletOptions.hideNoImage && !nft.image) {
				return
			}
			const id = getId(nftContract.contract, nftContract.network, nftContract.wallet)
			let element = Array.from(listLi).find(el => el.id === id + '-' + nftContract.tokenSymbol + '-' + nft.id)

			/*if(nft.image && nft.image.includes('ipfs://') && !nft.alt_image) {
			nft.alt_image = 'https://ipfs.io/ipfs/' + nft.image.slice(-nft.image.length + 7)
		}*/

			if(element) {
				let aTokenURI = element.querySelector('a.tokenURI')
				if(aTokenURI) {
					aTokenURI.href = nft.tokenURI
				} else if(nft.tokenURI){
					aTokenURI = document.createElement('a')
					aTokenURI.href = nft.tokenURI
					aTokenURI.target = '_blank'
					aTokenURI.classList.add('tokenURI')
					element.appendChild(aTokenURI)
				}

				if(nft.tokenURI && nft.image) {
					const preview = element.querySelector('img.preview')
					if(preview) {
						if(preview.src !== nft.image && preview.src !== nft.alt_image) {
							preview.src = nft.alt_image ? nft.alt_image : nft.image
						}
					} else {
						let imgPreview = document.createElement('img')
						imgPreview.src = nft.alt_image ? nft.alt_image : nft.image
						imgPreview.classList.add('preview')
						imgPreview.alt = 'NFT Metadata'
						imgPreview.loading = 'lazy'
						imgPreview.onerror = function() {
							this.onerror = null
							if(nft.image && nft.image.includes('ipfs://') && !nft.alt_image) {
								nft.alt_image = 'https://ipfs.io/ipfs/' + nft.image.slice(-nft.image.length + 7)
								this.src = nft.alt_image
							}
							return true
						}
						element.querySelector('a.tokenURI').appendChild(imgPreview)
					}
				}
			} else {
				let li = document.createElement('li')
				li.title = nftContract.tokenName + ' #' + nft.id
				li.id = id + '-' + nftContract.tokenSymbol + '-' + nft.id
				li.classList.add('nft')

				let spanNetwork = document.createElement('span')
				spanNetwork.classList.add('network')
				spanNetwork.appendChild(createNetworkImg(nftContract.network))
				li.appendChild(spanNetwork)

				let spanNameSymbol = document.createElement('span')
				spanNameSymbol.classList.add('nameSymbol')
				li.appendChild(spanNameSymbol)

				let spanSymbol = document.createElement('span')
				spanSymbol.innerHTML = nftContract.tokenSymbol
				spanSymbol.classList.add('symbol')
				spanNameSymbol.appendChild(spanSymbol)
				let spanName = document.createElement('span')
				spanName.innerHTML = nftContract.tokenName
				spanName.classList.add('name')
				spanNameSymbol.appendChild(spanName)

				let aAddress = document.createElement('a')
				let spanAddress = document.createElement('span')
				spanAddress.innerHTML = nftContract.contract.slice(0, 5) + '...' + nftContract.contract.slice(-5)
				spanAddress.classList.add('address')
				aAddress.href = NETWORK[nftContract.network].explorer + nftContract.contract
				aAddress.target = '_blank'
				aAddress.classList.add('address')
				aAddress.appendChild(spanAddress)
				spanNameSymbol.appendChild(aAddress)

				let spanTokenId = document.createElement('span')
				spanTokenId.innerHTML = '#' + nft.id
				spanTokenId.classList.add('tokenID')
				li.appendChild(spanTokenId)

				if(nft.tokenURI) { // TODO improve display when data is not reachable
					let aTokenURI = document.createElement('a')
					if(nft.image) {
						let imgPreview = document.createElement('img')
						imgPreview.src = nft.alt_image ? nft.alt_image : nft.image
						imgPreview.classList.add('preview')
						imgPreview.alt = 'NFT Metadata'
						imgPreview.loading = 'lazy'
						imgPreview.onerror = function() {
							this.onerror = null
							if(nft.image && nft.image.includes('ipfs://') && !nft.alt_image) {
								nft.alt_image = 'https://ipfs.io/ipfs/' + nft.image.slice(-nft.image.length + 7)
								this.src = nft.alt_image
							}
							return true
						}
						aTokenURI.appendChild(imgPreview)
					}
					aTokenURI.href = nft.tokenURI
					aTokenURI.target = '_blank'
					aTokenURI.classList.add('tokenURI')
					li.appendChild(aTokenURI)

				/*aTokenURI.addEventListener('click', function(e) {
				let item = e.target
				while(item.id.length < 1) {
				item = item.parentNode
			}
			expandCollapseItem(item)
		})*/
				}

				/*li.addEventListener('click', function(e) {
	let item = e.target
	while(item.id.length < 1 || item.id.includes('chart')) {
	item = item.parentNode
}
expandCollapseItem(item)
})*/

				document.getElementById('wallet-ul').appendChild(li)

			}
		})
	})

	if(nftContracts.length > 0) {

	} else {
		const stateContainer = document.getElementById('state')
		if(walletAddress && walletAddress.length > 0) {
			const spanNoNft = document.createElement('span')
			spanNoNft.innerHTML = loading ? 'Loading ...' : 'No NFT can be found on this address'
			spanNoNft.classList.add('loading-message')
			document.getElementById('wallet').appendChild(spanNoNft)
		//stateContainer.innerHTML = 'No NFT can be found on this address'
		//stateContainer.classList.toggle('shadow-white', true)
		} else {
			stateContainer.innerHTML = null
			stateContainer.classList.remove('shadow-white')
		}
	}

	// document.getElementById('global').classList.remove('none')
	document.getElementById('connect-demo-container').classList.toggle('none', true)

	document.getElementById('state').innerHTML = null
	document.getElementById('input-wallet-container').classList.remove('margin-top')
	document.getElementById('state').classList.remove('shadow-white')
}

function expandCollapseItem(item) {
	if(item.classList.contains('expanded')) {
		item.classList.remove('expanded')
	} else {
		item.classList.toggle('expanded', true)
	}
}

function displayTransactions() {
	let listLi = document.getElementById('wallet').querySelectorAll('li')

	document.getElementById('wallet').innerHTML = null

	if(!walletAddress) {
		return
	}

	const transactions = buildTxArray()

	// console.log(transactions)

	document.getElementById('wallet').innerHTML = null
	if(transactions.length > 0) {
		let ul = document.createElement('ul')
		ul.id = 'wallet-ul'
		document.getElementById('wallet').appendChild(ul)
	}

	let day = ''

	transactions.forEach((tx) => {
		const txDate = new Date(tx.timeStamp * 1000)
		const txDay = txDate.toLocaleDateString()
		if(txDay !== day) {
			let divDate = document.createElement('div')
			divDate.innerHTML = txDay
			divDate.classList.add('date')
			document.getElementById('wallet-ul').appendChild(divDate)
			day = txDay
		}


		let li = document.createElement('li')
		// li.title = ''
		li.id = tx.id
		li.classList.add('transaction')

		let spanNetwork = document.createElement('span')
		spanNetwork.classList.add('network')
		spanNetwork.appendChild(createNetworkImg(tx.network))
		li.appendChild(spanNetwork)

		let spanNonceTimestamp = document.createElement('span')
		spanNonceTimestamp.classList.add('nonceTimestamp')
		li.appendChild(spanNonceTimestamp)

		let spanNonce = document.createElement('span')
		spanNonce.innerHTML = tx.nonce
		spanNonce.title = 'Nonce ' + tx.nonce
		spanNonce.classList.add('nonce')
		spanNonceTimestamp.appendChild(spanNonce)
		let spanTimestamp = document.createElement('span')
		spanTimestamp.innerHTML = txDate.toLocaleTimeString()
		spanTimestamp.classList.add('timestamp')
		spanNonceTimestamp.appendChild(spanTimestamp)

		let spanBalance = document.createElement('span')
		spanBalance.innerHTML = (tx.to && tx.to.toLowerCase() !== tx.wallet.toLowerCase() ? '-' : '+') + calculateBalance(tx.value, tx.tokenDecimal)
		spanBalance.classList.add('txBalance')
		li.appendChild(spanBalance)

		let spanNameSymbol = document.createElement('span')
		spanNameSymbol.classList.add('nameSymbol')
		spanNameSymbol.classList.add('txNameSymbol')
		li.appendChild(spanNameSymbol)

		let spanSymbol = document.createElement('span')
		spanSymbol.innerHTML = tx.tokenSymbol
		spanSymbol.classList.add('symbol')
		spanNameSymbol.appendChild(spanSymbol)
		let spanName = document.createElement('span')
		spanName.innerHTML = tx.tokenName
		spanName.classList.add('name')
		spanNameSymbol.appendChild(spanName)

		document.getElementById('wallet-ul').appendChild(li)
	})

	if(transactions.length > txDisplay.limit) {
		let divLoadMore = document.createElement('div')
		divLoadMore.innerHTML = '...'
		divLoadMore.classList.add('loadMore')
		document.getElementById('wallet').appendChild(divLoadMore)
	}


	if(transactions.length > 0) {
		// document.getElementById('global').classList.remove('none')
		document.getElementById('connect-demo-container').classList.toggle('none', true)
		document.getElementById('state').innerHTML = null
		document.getElementById('input-wallet-container').classList.remove('margin-top')
		document.getElementById('state').classList.remove('shadow-white')
	} else {
		// document.getElementById('global').classList.toggle('none', true)
		document.getElementById('input-wallet-container').classList.toggle('margin-top', true)
		document.getElementById('connect-demo-container').classList.remove('none')
		const stateContainer = document.getElementById('state')
		if(walletAddress && walletAddress.length > 0) {
			stateContainer.innerHTML = 'No transactions can be found :()'
			stateContainer.classList.toggle('shadow-white', true)
		} else {
			stateContainer.innerHTML = null
			stateContainer.classList.remove('shadow-white')
		}
	}
}

// Insert a DOM element after a Reference element
function insertAfter(refElement, element) {
	refElement.parentNode.insertBefore(element, refElement.nextSibling)
}

// Update & Display the total wallet value
function updateGlobalPrice() {
	walletValue = 0
	filteredWallet().forEach(function (token) {
		if(token.price) {
			walletValue += Number.parseFloat(calculateValue(token.value, token.price, token.tokenDecimal))
		}
	})

	document.getElementById('wallet-value').innerHTML = walletValue > 0 ? '$' + Math.round(walletValue) : null

}

function displayChartTooltip(e) {
	if(!e.tooltip.dataPoints) {
		return
	}
	const value = e.tooltip.dataPoints[0].raw
	const date = new Date(parseInt(e.tooltip.dataPoints[0].parsed.x)).toLocaleString()
	if(e.tooltip.opacity > 0) { // display tooltip
		document.getElementById('wallet-value-tooltip').innerHTML = value > 0 ? '$' + Math.round(value) : null
		document.getElementById('wallet-date-tooltip').innerHTML = date
	} else { // hide tooltip
		document.getElementById('wallet-value-tooltip').innerHTML = null
		document.getElementById('wallet-date-tooltip').innerHTML = null
	}
}



/* MAIN */
initializeHTML()
simpleDataTimers()




async function initializeHTML() {
	/* Initialize LocalForage */
	localforage.config({
		size: 15000000 // 15 MB
	})
	walletForage = localforage.createInstance({
		name: 'wallet'
	})




	const urlParams = new URLSearchParams(window.location.search)
	const hash = window.location.hash
	let address = null
	if(urlParams.has('address')) {
		address = urlParams.get('address').split(',')
	}
	else if(sessionStorage.getItem('walletAddress')) {
		address = sessionStorage.getItem('walletAddress').split(',')
	}
	if(address) {
		document.getElementById('input-wallet').value = address.join(',')
		configureWallet(address)
	}

	if(sessionStorage.getItem('walletOptions')) {
		walletOptions = JSON.parse(sessionStorage.getItem('walletOptions'))
	}
	document.getElementById('hide-small-balances-icon').src = walletOptions.hideSmallBalance ? '/img/icons/check-square.svg' : '/img/icons/square.svg'
	document.getElementById('hide-no-image-icon').src = walletOptions.hideNoImage ? '/img/icons/check-square.svg' : '/img/icons/square.svg'
	walletOptions.menu[Object.keys(walletOptions.menu).find(item => walletOptions.menu[item].isActive)].isActive = false
	if(hash) {
		const menu = Object.keys(walletOptions.menu).find(item => walletOptions.menu[item].hash === hash)
		try {
			walletOptions.menu[menu].isActive = true
		} catch {
			walletOptions.menu.tokens.isActive = true
		}
	} else {
		walletOptions.menu.tokens.isActive = true
	}

	toggleHideButtons()

	const networkList = document.getElementById('filter-by-network-list')
	Object.keys(NETWORK).sort(sortByChainId).forEach((network) => {
		const li = document.createElement('li')
		li.id = 'filter-by-' + NETWORK[network].enum
		li.classList.add('filter-by-network-item')
		const img = createNetworkImg(network)
		img.classList.add('filter-by-network-img')
		li.appendChild(img)

		const statusImg = document.createElement('img')
		statusImg.classList.add('filter-by-network-status', 'checked')
		statusImg.src = '/img/icons/check-circle.svg'
		statusImg.width = '12'
		statusImg.height = '12'
		li.appendChild(statusImg)

		networkList.appendChild(li)

		filters.networks.push(NETWORK[network].enum)
	})
	networkList.addEventListener('click', e => {
		if(!e.target) {
			return
		}
		let clicked
		if(e.target.nodeName === 'LI') {
			clicked = e.target
		} else if (e.target.parentNode.nodeName === 'LI') {
			clicked = e.target.parentNode
		}
		if(clicked) {
			const filter = clicked.id.split('-')[2]
			toggleNetworkFilter(filter)
		}
	})

	document.getElementById('filter-by-network-container').classList.remove('none')

	setTimeout(() => {
		document.getElementById('global').style = ''
		document.getElementById('pie-charts').style = ''
	}, 1000)

	configureWalletEvents()
}

function configureWalletEvents() {
	document.getElementById('wallet').addEventListener('click', e => {
		e.preventDefault()
		let target = e.target
		if(target.id === 'wallet' || target.id === 'wallet-ul') {
			return
		}

		while(target.nodeName !== 'LI') {
			target = target.parentNode
		}

		expandCollapseItem(target)
	})
}

function toggleHideButtons() {
	if(walletOptions.menu.tokens.isActive) {
		document.getElementById('hide-small-balances-container').classList.remove('none')
		document.getElementById('hide-no-image-container').classList.toggle('none', true)
		document.getElementById('global').classList.remove('none')
		document.getElementById('pie-charts').classList.remove('none')
		document.getElementById('wallet').classList.remove('nft')
	} else if(walletOptions.menu.nfts.isActive) {
		document.getElementById('hide-no-image-container').classList.remove('none')
		document.getElementById('hide-small-balances-container').classList.toggle('none', true)
		document.getElementById('global').classList.toggle('none', true)
		document.getElementById('pie-charts').classList.toggle('none', true)
		document.getElementById('wallet').classList.toggle('nft', true)
	} else if(walletOptions.menu.transactions.isActive) {
		document.getElementById('hide-no-image-container').classList.toggle('none', true)
		document.getElementById('hide-small-balances-container').classList.toggle('none', true)
		document.getElementById('global').classList.toggle('none', true)
		document.getElementById('pie-charts').classList.toggle('none', true)
		document.getElementById('wallet').classList.remove('nft')
	}
}

function toggleNetworkFilter(network) {
	const li = document.getElementById('filter-by-' + network)
	const imgStatus = li.getElementsByClassName('filter-by-network-status')[0]
	if(filters.networks.includes(network)) {
		imgStatus.src = '/img/icons/x-circle.svg'
		imgStatus.classList.remove('checked')
		imgStatus.classList.add('unchecked')
		filters.networks.splice(filters.networks.indexOf(network), 1)
	} else {
		imgStatus.src = '/img/icons/check-circle.svg'
		imgStatus.classList.remove('unchecked')
		imgStatus.classList.add('checked')
		filters.networks.push(network)
	}

	if(walletAddress) {
		displayWallet(true)
	}
}

function simpleDataTimers() {
	Object.keys(NETWORK).filter((network) => NETWORK[network].url_data !== '').forEach((network, i) => {
		setTimeout(() => getSimpleData(NETWORK[network].enum, displayWallet), (i+1) * 250)

		if(network === NETWORK.ETHEREUM.enum) {
			getAaveEthereumUnderlyingAddresses(displayWallet)
			getCompoundEthereumUnderlyingAddresses(displayWallet)
		} else if(network === NETWORK.POLYGON.enum) {
			getAavePolygonUnderlyingAddresses(displayWallet)
		} else if(network === NETWORK.BSC.enum) {
			getVenusBscUnderlyingAddresses(displayWallet)
		}
	})
	setTimeout(simpleDataTimers, 100000)
}


document.getElementById('menu-tokens').addEventListener('click', (e) => {
	e.preventDefault()

	if(walletOptions.menu.tokens.isActive) {
		return
	}
	walletOptions.menu[Object.keys(walletOptions.menu).find(menu => walletOptions.menu[menu].isActive)].isActive = false
	walletOptions.menu.tokens.isActive = true
	sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))

	window.location.hash = walletOptions.menu.tokens.hash

	toggleHideButtons()
	displayWallet(true)

	walletAddress.forEach((address) => {
		getNetworksOfAddress(address).forEach((network) => {
			clearTimeoutIf(timerGetNetworkBalance, network, address)
			clearTimeoutIf(timerGetERC721Tx, network, address)
			clearTimeoutIf(timerGetTransactions, network, address)
			getNetworkBalance(NETWORK[network].enum, address)
			getTokenTx(NETWORK[network].enum, address, searchTokens)
		})
	})

})
document.getElementById('menu-nfts').addEventListener('click', (e) => {
	e.preventDefault()

	if(walletOptions.menu.nfts.isActive) {
		return
	}
	walletOptions.menu[Object.keys(walletOptions.menu).find(menu => walletOptions.menu[menu].isActive)].isActive = false
	walletOptions.menu.nfts.isActive = true
	sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))

	window.location.hash = walletOptions.menu.nfts.hash

	toggleHideButtons()
	displayWallet(true)

	walletAddress.forEach((address) => {
		getNetworksOfAddress(address).forEach((network) => {
			clearTimeoutIf(timerGetTokenTx, network, address)
			clearTimeoutIf(timerGetTransactions, network, address)
			getERC721Tx(NETWORK[network].enum, address, searchNFTs)
		})
	})
})
document.getElementById('menu-transactions').addEventListener('click', (e) => {
	e.preventDefault()

	if(walletOptions.menu.transactions.isActive) {
		return
	}
	walletOptions.menu[Object.keys(walletOptions.menu).find(menu => walletOptions.menu[menu].isActive)].isActive = false
	walletOptions.menu.transactions.isActive = true
	sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))

	window.location.hash = walletOptions.menu.transactions.hash

	toggleHideButtons()
	displayWallet(true)

	walletAddress.forEach((address) => {
		getNetworksOfAddress(address).forEach((network) => {
			clearTimeoutIf(timerGetNetworkBalance, network, address)
			clearTimeoutIf(timerGetTokenTx, network, address)
			clearTimeoutIf(timerSearchTokens, network, address)
			clearTimeoutIf(timerGetERC721Tx, network, address)
			getTransactions(NETWORK[network].enum, address)
		})
	})
})
document.getElementById('hide-small-balances-container').addEventListener('click', (e) => {
	e.preventDefault()
	walletOptions.hideSmallBalance = !walletOptions.hideSmallBalance
	sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))
	document.getElementById('hide-small-balances-icon').src = walletOptions.hideSmallBalance ? '/img/icons/check-square.svg' : '/img/icons/square.svg'

	displayWallet(true)
})
document.getElementById('hide-no-image-container').addEventListener('click', (e) => {
	e.preventDefault()
	walletOptions.hideNoImage = !walletOptions.hideNoImage
	sessionStorage.setItem('walletOptions', JSON.stringify(walletOptions))
	document.getElementById('hide-no-image-icon').src = walletOptions.hideNoImage ? '/img/icons/check-square.svg' : '/img/icons/square.svg'

	displayWallet(true)
})

function updatePieCharts() {
	if(!walletAddress || !walletAddress[0]) {
		if(Object.keys(pieCharts).length > 0) {
			Object.keys(pieCharts).forEach((chart) => pieCharts[chart].destroy())
			pieCharts = {}
		}
		return
	}



	if(filters.address.length < 2) {
		if(pieCharts && pieCharts.pieAddresses) {
			pieCharts.pieAddresses.destroy()
			delete pieCharts.pieAddresses
			document.getElementById('pie-addresses-container').style.display = 'none'
		}
	} else {
		let pieAddressesData = [], pieAddressesLabels = [], pieAddressesColors = []
		filters.address.forEach((address) => {
			let total = 0
			filters.networks.forEach((network) => {
				Object.keys(wallet[address])
					.filter((id) => id.startsWith(network))
					.forEach((id) => {
						if(wallet[address][id].price) {
							total += parseFloat(calculateValue(wallet[address][id].value, wallet[address][id].price, wallet[address][id].tokenDecimal))
						}
					})
			})
			pieAddressesLabels.push(address.slice(0,6) + '...' + address.slice(-4))
			pieAddressesData.push(total)
			pieAddressesColors.push(getColorFromString(address))
		})

		document.getElementById('pie-addresses-container').style.display = 'block'

		// Addresses distribution
		if(pieCharts && pieCharts.pieAddresses) {
			pieCharts.pieAddresses.data.labels = pieAddressesLabels
			pieCharts.pieAddresses.data.datasets[0].data = pieAddressesData
			pieCharts.pieAddresses.data.datasets[0].backgroundColor = pieAddressesColors
			pieCharts.pieAddresses.update()
		} else {
			const ctx = document.getElementById('pie-addresses').getContext('2d')
			pieCharts.pieAddresses = new Chart(ctx, {
				type: 'pie',
				labels: pieAddressesLabels,
				data: {
					datasets: [{
						data: pieAddressesData,
						backgroundColor: pieAddressesColors,
						hoverOffset: 15,
						borderRadius: 8
					}]
				}
				,
				options: {
					responsive: true,
					aspectRatio: 1,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							labels: {
								font: {
									size: 10
								}
							},
							position: 'left',
						},
						title: {
							display: true,
							text: 'Addresses distribution'
						}
					}
				}
			})
		}
	}





	let pieNetworksData = [], pieNetworksLabels = [], pieNetworksColors = []
	filters.networks.forEach((network) => {
		let total = 0
		filters.address.forEach((address) => {
			Object.keys(wallet[address])
				.filter((id) => id.startsWith(network))
				.forEach((id) => {
					if(wallet[address][id].price) {
						total += parseFloat(calculateValue(wallet[address][id].value, wallet[address][id].price, wallet[address][id].tokenDecimal))
					}
				})
		})
		if(total > 0) {
			pieNetworksLabels.push(NETWORK[network].name)
			pieNetworksData.push(total)
			pieNetworksColors.push(NETWORK[network].color)
		}
	})


	if(filters.networks.length < 2 || pieNetworksData.filter((value) => value > 0).length < 2) {
		if(pieCharts && pieCharts.pieNetworks) {
			pieCharts.pieNetworks.destroy()
			delete pieCharts.pieNetworks
			document.getElementById('pie-networks-container').style.display = 'none'
		}
	} else {
		document.getElementById('pie-networks-container').style.display = 'block'
		// Networks distribution
		if(pieCharts && pieCharts.pieNetworks) {
			pieCharts.pieNetworks.data.labels = pieNetworksLabels
			pieCharts.pieNetworks.data.datasets[0].data = pieNetworksData
			pieCharts.pieNetworks.data.datasets[0].backgroundColor = pieNetworksColors
			pieCharts.pieNetworks.update()
		} else {
			const ctx = document.getElementById('pie-networks').getContext('2d')
			pieCharts.pieNetworks = new Chart(ctx, {
				type: 'pie',
				labels: pieNetworksLabels,
				data: {
					datasets: [{
						data: pieNetworksData,
						backgroundColor: pieNetworksColors,
						hoverOffset: 15,
						borderRadius: 8
					}]
				}
				,
				options: {
					responsive: true,
					aspectRatio: 1,
					maintainAspectRatio: false,
					plugins: {
						legend: {
							labels: {
								font: {
									size: 10
								}
							},
							position: 'left',
						},
						title: {
							display: true,
							text: 'Networks distribution'
						}
					}
				}
			})
		}
	}




	let pieTokensData = [], pieTokensLabels = [], pieTokensColors = []
	filters.networks.forEach((network) => {
		filters.address.forEach((address) => {
			Object.keys(wallet[address])
				.filter((id) => id.startsWith(network))
				.forEach((id) => {
					const balance = calculateValue(wallet[address][id].value, wallet[address][id].price, wallet[address][id].tokenDecimal)
					if(balance && balance > walletOptions.smallBalance) {
						pieTokensData.push(balance)
						pieTokensLabels.push(wallet[address][id].tokenSymbol)
						pieTokensColors.push(getColorFromString(id))
					}
				})
		})
	})


	// Tokens distribution
	if(pieCharts && pieCharts.pieTokens) {
		pieCharts.pieTokens.data.labels = pieTokensLabels
		pieCharts.pieTokens.data.datasets[0].data = pieTokensData
		pieCharts.pieTokens.data.datasets[0].backgroundColor = pieTokensColors
		pieCharts.pieTokens.options.plugins.legend.display = pieTokensLabels.length < 6
		pieCharts.pieTokens.update()
	} else {
		const ctx = document.getElementById('pie-tokens').getContext('2d')
		pieCharts.pieTokens = new Chart(ctx, {
			type: 'pie',
			labels: pieTokensLabels,
			data: {
				datasets: [{
					data: pieTokensData,
					backgroundColor: pieTokensColors,
					hoverOffset: 15,
					borderRadius: 8
				}]
			},
			options: {
				responsive: true,
				aspectRatio: 1,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						labels: {
							font: {
								size: 10
							}
						},
						position: 'left',
					},
					title: {
						display: true,
						text: 'Tokens distribution'
					}
				}
			}
		})
	}
}

function updateGlobalChart() {
	if(!walletAddress || !walletAddress[0] || walletValue === 0) {
		if(globalChart) {
			globalChart.destroy()
			globalChart = null
		}
		return
	}
	const network = NETWORK.ETHEREUM.enum
	const address = NETWORK.ETHEREUM.tokenPriceContract
	let chart = JSON.parse(sessionStorage.getItem(network + '-' + address))
	const lastFetch = sessionStorage.getItem(network + '-' + address + '-lastFetch')
	const now = new Date().getTime()
	if(!chart || (chart && !chart.chart_often) || (chart && chart.chart_often && chart.chart_often.length < 1) || (now - lastFetch > 3*60*1000)) {
		if(loadingChartsByAddress === false) {
			getChartsByAddress(NETWORK.ETHEREUM.tokenPriceContract, NETWORK.ETHEREUM.enum, updateGlobalChart)
		}
		return
	}

	chart = extractChartByDuration(chart.chart_often, 2 * TIME_24H)

	const last_price = chart[chart.length - 1].p

	const timeData = chart.map(coords => new Date(coords.t))
	const tokenData = chart.map(coords => coords.p * walletValue / last_price)

	const ctx = document.getElementById('wallet-chart').getContext('2d')
	if(globalChart) {
		globalChart.data.labels = timeData
		globalChart.data.datasets[0].data = tokenData
		globalChart.update()
	} else {
		globalChart = new Chart(ctx, {
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
						enabled: false,
						intersect: false,
						external: displayChartTooltip
					}
				},
				interaction: {
					mode: 'index',
					intersect: false,
				},
				animation: false,
				responsive: true,
				maintainAspectRatio: false,
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
}


/* Utils - Return the Contract depending on the network */
const getContract = (contractAddress, network) => {
	return new (getWeb3(network).eth).Contract(minABI, contractAddress)
}
/* Utils - Return the NFT Contract depending on the network */
const getNFTContract = (contractAddress, network) => {
	return new (getWeb3(network).eth).Contract(nftABI, contractAddress)
}

/* Utils - Build transactions array */
const buildTxArray = () => {
	let transactions = []

	try {
		filters.networks.forEach((network) => {
			walletAddress.forEach((address) => {
				if(tokentx && tokentx[address] && tokentx[address][network]) {
					tokentx[address][network].forEach((item) => {
						if(item) {
							const id = network + '-' + item.nonce + '-' + item.tokenSymbol + '-' + item.tokenName
							if(transactions.findIndex(tx => tx.id === id) < 0) {
								transactions.push({ ...item, network: network, id: id, wallet: address })
							}
						}
					})
				}
				if(erc721tx && erc721tx[address] && erc721tx[address][network]) {
					erc721tx[address][network].forEach((item) => {
						if(item) {
							const id = network + '-' + item.nonce + '-' + item.tokenSymbol + '-' + item.tokenName
							if(transactions.findIndex(tx => tx.id === id) < 0) {
								transactions.push({ ...item, network: network, id: id, wallet: address })
							}
						}
					})
				}
			})
		})

		txDisplay.hasMore = transactions.length > txDisplay.limit
		transactions = transactions.sort(sortTransactions).slice(0, txDisplay.limit)
	} catch(e) {
		console.error(e)
	}

	return transactions
}

/* Utils - sort the wallet */
const sortWallet = (a, b) => {
	// sort by network
	if(NETWORK[a.network].chainId < NETWORK[b.network].chainId) return -1
	if(NETWORK[a.network].chainId > NETWORK[b.network].chainId) return 1
	// then sort by token network (eg: Ethereum, Matic, etc are first)
	if(NETWORK[a.network].tokenContract === a.contract) return -1
	if(NETWORK[b.network].tokenContract === b.contract) return 1
	// then sort by price value
	if(a.price && b.price) {
		if(a.value * a.price > b.value * b.price) return -1
		if(a.value * a.price < b.value * b.price) return 1
	}
	if(!a.price && b.price) return 1
	if(a.price && !b.price) return -1
	// then sort by name
	return a.tokenName.localeCompare(b.tokenName)
}
/* Utils - sort the NFT wallet */
const sortNFTWallet = (a, b) => {
	// sort by network
	if(NETWORK[a.network].chainId < NETWORK[b.network].chainId) return -1
	if(NETWORK[a.network].chainId > NETWORK[b.network].chainId) return 1
	// then sort by name
	return a.tokenName.localeCompare(b.tokenName)
}
/* Utils - sort the NFT tokens (can have many tokens of the same contract) */
const sortNFTTokens = (t_a, t_b) => {
	try {
		if(parseInt(t_a.id, 10) < parseInt(t_b.id, 10)) return -1
		if(parseInt(t_a.id, 10) > parseInt(t_b.id, 10)) return 1
	} catch {
		return t_a.id.localeCompare(t_b.id)
	}
}
/* Utils - sort the transactions */
const sortTransactions = (tx_a, tx_b) => {
	// sort by timestamp
	if(tx_a.timeStamp > tx_b.timeStamp) return -1
	if(tx_a.timeStamp < tx_b.timeStamp) return 1
	//if(parseInt(tx_a.timeStamp, 10) > parseInt(tx_b.timeStamp, 10)) return -1
	//if(parseInt(tx_a.timeStamp, 10) < parseInt(tx_b.timeStamp, 10)) return 1
	// display outgoing tokens before incoming ones
	if(tx_a.to && tx_a.wallet && tx_a.to.toLowerCase() === tx_a.wallet.toLowerCase()) return -1
	return 1
	//return tx_a.from.toLowerCase().localeCompare(walletAddress[0].toLowerCase())
}

/* Utils - getId from Address and Network */
const getId = (address, network, wallet) => {
	return wallet ? wallet + '-' + network + '-' + address : network + '-' + address
}

/* Utils - Wallet with not null value token */
const filteredWallet = () => {
	let filtered = []
	if(!filters.address || Object.keys(wallet).length === 0) {
		return filtered
	}
	filters.address.forEach((address) => {
		Object.keys(wallet[address])
			.filter(key => filters.networks.includes(key.split('-')[0]))
			.filter(id => wallet[address][id].value && wallet[address][id].value !== '0')
			.forEach((id) => {
				if(!walletOptions.hideSmallBalance || (walletOptions.hideSmallBalance &&  Math.abs(calculateValue(wallet[address][id].value, wallet[address][id].price, wallet[address][id].tokenDecimal)) >= walletOptions.smallBalance)) {
					filtered.push({ ...wallet[address][id], wallet: address })
				}
			})
	})
	return filtered
}

/* Utils - Wallet with/without preview images */
const filteredNFTWallet = () => {
	let filteredNFTContracts = []
	filters.address.forEach((address) => {
		Object.keys(wallet_NFT[address])
			.filter(key => filters.networks.includes(key.split('-')[0]))
			.forEach((id) => {
				if(!walletOptions.hideNoImage || (walletOptions.hideNoImage && wallet_NFT[address][id].tokens.some(token => token.tokenURI && token.image))) {
					filteredNFTContracts.push({ ...wallet_NFT[address][id], wallet: address })
				}
			})
	})

	return filteredNFTContracts
}
/* Utils - NFTs with/without preview images */
const filteredNFTTokens = () => {
	return filteredNFTWallet().map(id => wallet_NFT[address][id].tokens).flat()
}

/* Utils - Calculate balance from value */
const calculateBalance = (balance, decimal) => {
	if(balance && Math.abs(balance) > 0) {
		return precise(balance * Math.pow(10, -decimal))
	}
	return 0
}
/* Utils - Calculate value from value */
const calculateValue = (balance, price, decimal) => {
	if(balance && price && Math.abs(balance * price) > 0) {
		return calculateBalance(balance * price, decimal)
	}
	return 0
}
/* Utils - Display balance readable by human */
const displayBalance = (value, decimal) => {
	const balance = calculateBalance(value, decimal)
	if(balance === 0) return 0
	if(Math.abs(balance) < 0.01) return '≈ 0'
	return balance
}
/* Utils - Display dollar value readable by human */
const displayValue = (balance, price, decimal) => {
	const value = calculateBalance(balance * price, decimal)
	if(value === 0) return 0
	if(Math.abs(value) < 0.01) return '≈ 0'
	return '$' + value
}

/* Utils - Check if exist and clear it */
function clearTimeoutIf(timeout, network, address) {
	if(timeout[network] && timeout[network][address]) {
		clearTimeout(timeout[network][address])
	}
}
