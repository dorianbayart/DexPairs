'use strict'



setTimeout(() => {
	socketMessageSend({ type: 'statistics' })
}, 1000)

const displayStatistics = (statistics) => {
	// console.log(statistics)
	const statsHTML = document.getElementById('statistics')
	if(statsHTML) {
		statsHTML.innerHTML = JSON.stringify(statistics, null, 2)
	}
}
