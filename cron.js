'use strict'

import cp from 'child_process'

const backFolder = './back'

start()


/* MAIN */
async function start() {
	
	setTimeout(launchCoingecko, 4000)

}


async function launchCoingecko() {
	setTimeout(launchCoingecko, process.env.NODE_ENV === 'production' ? 20000 : 45000) // 20 or 45 seconds

	cp.fork(backFolder + '/coingecko.js')
}
