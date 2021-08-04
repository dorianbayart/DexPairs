const t = (entry, tname) => entry.getElementsByTagName(tname)[0]
const date = entry => new Date(t(entry, 'published').textContent).toLocaleString('en-US')

fetch('/feed.atom')
  .then(response => response.text())
  .then(xml => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, "text/xml").documentElement
    const html = Array.from(xmlDoc.getElementsByTagName('entry')).map(entry => `<article class="entry">
          <div class="timestamp">${date(entry)}</div>
          <h1 class="entry-title">${t(entry, 'title').innerHTML}</h1>
          <div class="entry-content">${t(entry, 'content').innerHTML}</div>
        </article>`)
    document.getElementById('items').innerHTML = html.join('')
  })
