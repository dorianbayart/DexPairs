'use strict'

import cp from 'child_process'

const backFolder = './back'

start()


/* MAIN */
async function start() {
	// launchCoingecko()
	setTimeout(launchCoingecko, 1000)

}


async function launchCoingecko() {
	setTimeout(launchCoingecko, process.env.NODE_ENV === 'production' ? 10000 : 30000) // 10 or 30 seconds

	cp.fork(backFolder + '/coingecko.js')
}
