'use strict'

const cp = require('child_process')

const backFolder = './back'

start()


/* MAIN */
async function start() {
	// launchCoingecko()
	setTimeout(launchCoingecko, 1000)

}


async function launchCoingecko() {
	setTimeout(launchCoingecko, process.env.NODE_ENV === 'production' ? 5000 : 20000) // 5 or 20 seconds

	cp.fork(backFolder + '/coingecko.js')
}
