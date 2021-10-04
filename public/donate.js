'use strict'

document.getElementById('click-to-copy').addEventListener('click', function(e) {
	e.preventDefault()
	navigator.clipboard.writeText('0x0255c9D3850cacA1152AEB20425C264787661692')

	document.getElementById('copy-icon').src = '/img/icons/check.svg'
	setTimeout(() => document.getElementById('copy-icon').src = '/img/icons/copy.svg', 2500)

	document.getElementById('click-to-copy-description').innerHTML = 'Wallet address copied !'
	setTimeout(() => document.getElementById('click-to-copy-description').innerHTML = 'Click here to copy wallet address', 2500)
})
