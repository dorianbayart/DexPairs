'use strict'



let walletConnected, networkConnected



const initialize = () => {
	const { ethereum } = window
	const onboardButton = document.getElementById('connect-button')

	const isMetaMaskInstalled = () => {
		return Boolean(ethereum && ethereum.isMetaMask)
	}

	// const onboarding = new MetaMaskOnboarding({ forwarderOrigin })

	const onClickInstall = () => {
		onboardButton.innerText = 'Refresh the page when MetaMask is installed'
		onboardButton.disabled = true
		window.open('https://metamask.io/download/', '_blank').focus()
	}

	const onClickConnect = async () => {
		try {
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
			if(walletConnected !== accounts[0]) {
				walletConnected = accounts[0]
				networkConnected = ethereum.networkVersion
				updateConnectedAccount()
			}
		} catch (error) {
			console.error(error)
		}
	}

	const MetaMaskClientCheck = async () => {
		if (!isMetaMaskInstalled()) {
			onboardButton.innerText = 'Click here to install MetaMask!'
			onboardButton.onclick = onClickInstall
			onboardButton.disabled = false
		} else {
			onboardButton.onclick = onClickConnect
			onboardButton.disabled = false

			if(sessionStorage.getItem('connected-account')) {
				const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
				walletConnected = accounts[0]
				networkConnected = ethereum.networkVersion
				updateConnectedAccount()
			}
		}
	}

	if(ethereum) {
		ethereum.on('accountsChanged', function (accounts) {
			networkConnected = ethereum.networkVersion
			walletConnected = accounts[0]
			updateConnectedAccount()
		})
	}

	MetaMaskClientCheck()
}


const updateConnectedAccount = (account) => {
	const currentAddress = account ? account : walletConnected
	const onboardButton = document.getElementById('connect-button')
	onboardButton.innerText = currentAddress
	if(!currentAddress) {
		resetConnectButton()
		sessionStorage.removeItem('connected-account')
		return
	}

	if(CURRENT_PAGE === PAGES.WALLET && currentAddress) {
		configureWallet([currentAddress])
		document.getElementById('input-wallet').value = currentAddress
	}

	sessionStorage.setItem('connected-account', walletConnected)
}


const resetConnectButton = () => {
	const onboardButton = document.getElementById('connect-button')
	onboardButton.innerText = 'Connect'
	const img = document.createElement('img')
	onboardButton.prepend(img)
	img.src = '/img/metamask-fox.svg'
	img.alt = 'Metamask SVG Logo'
	img.title = 'Connect your wallet'
}


window.addEventListener('DOMContentLoaded', initialize)
