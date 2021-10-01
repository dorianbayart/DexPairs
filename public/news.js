'use strict'

const t = (entry, tname) => entry.getElementsByTagName(tname)[0]
const date = entry => new Date(t(entry, 'published').textContent).toLocaleString('en-US')
const DOMAIN_NAME = 'DexPairs.xyz'

let feed = []

const backButton = document.createElement('button')
backButton.classList.add('back-button')
backButton.innerHTML = 'Back to News'
backButton.addEventListener('click', () => {
	displayNews('home')
})

const displayNews = (urlTitle) => {
	let article = feed.find(entry => entry.id.includes(urlTitle))

	if(article) {
		if(window.history.replaceState) {
			window.history.replaceState(null, DOMAIN_NAME + ' | News | ' + article.title.innerHTML, window.location.href.split('?')[0] + '?title=' + urlTitle)
		}
		document.querySelector('title').innerHTML = DOMAIN_NAME + ' | News | ' + article.title.innerHTML
		document.querySelector('meta[property="og:title"]').setAttribute('content', DOMAIN_NAME + ' | News | ' + article.title.innerHTML)
		document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href)

		const html = `<article class="entry">
          <div class="timestamp">${article.timestamp}</div>
          <h1 class="entry-title">${article.title.innerHTML}</h1>
          <div class="entry-content">${article.content.innerHTML}</div>
        </article>`

		document.getElementById('items').innerHTML = html
		document.getElementById('items').insertBefore(backButton, document.getElementById('items').childNodes[0])
	} else {
		if(window.history.replaceState) {
			window.history.replaceState(null, DOMAIN_NAME + ' | News', window.location.href.split('?')[0])
		}
		document.querySelector('title').innerHTML = DOMAIN_NAME + ' | News'
		document.querySelector('meta[property="og:title"]').setAttribute('content', DOMAIN_NAME + ' | News')
		document.querySelector('meta[property="og:url"]').setAttribute('content', window.location.href)

		const html = feed.map(entry => `<a href="news/${entry.id.split(':')[2]}" id="${entry.id}" class="entry condensed">
          <div class="timestamp">${entry.timestamp}</div>
          <h1 class="entry-title">${entry.title.innerHTML}</h1>
        </a>`)
		document.getElementById('items').innerHTML = html.join('')

		Array.from(document.getElementById('items').getElementsByTagName('article')).forEach(
			element =>
				element.addEventListener('click', (e) => {
					const item = e.target.id ? e.target : e.target.parentElement
					displayNews(item.id.split(':')[2])
				})

		)
	}
}

fetch('/feed.atom')
	.then(response => response.text())
	.then(xml => {
		const parser = new DOMParser()
		const xmlDoc = parser.parseFromString(xml, 'text/xml').documentElement
		const urlParams = new URLSearchParams(window.location.search)
		const urlTitle = urlParams.has('title') ? urlParams.get('title') : 'home'
		feed = Array.from(xmlDoc.getElementsByTagName('entry')).map(entry => {
			return {
				id: t(entry, 'id').innerHTML,
				timestamp: date(entry),
				link: t(entry, 'link'),
				title: t(entry, 'title'),
				content: t(entry, 'content')
			}
		})

		displayNews(urlTitle)
	})
