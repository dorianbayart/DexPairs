'use strict'



setTimeout(() => {
	socketMessageSend({ type: 'statistics', url: window.location.href })
}, 1000)

const displayStatistics = (statistics) => {
	console.log(statistics)

	document.getElementById('statistics').innerHTML = JSON.stringify(statistics.latests)
}
