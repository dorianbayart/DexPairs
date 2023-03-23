'use strict'

import cp from 'child_process'

const backFolder = './back'

start()


/* MAIN */
async function start() {
	// launchCoingecko()
	setTimeout(launchCoingecko, 4000)

}


async function launchCoingecko() {
	setTimeout(launchCoingecko, process.env.NODE_ENV === 'production' ? 12000 : 45000) // 12 or 45 seconds

	cp.fork(backFolder + '/coingecko.js')
}
