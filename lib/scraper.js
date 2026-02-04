import axios from 'axios'
import * as cheerio from 'cheerio'

const baseUrl = 'https://v3.animekompi.fun'

// --- Helper untuk bypass header jika diperlukan ---
const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
});

export async function getHome(page = 1) {
  const { data } = await axiosInstance.get(`${baseUrl}/page/${page}/`)
  const $ = cheerio.load(data)

  const result = {
    slide: [],
    rilisanTerbaru: [],
    rekomendasiGenre: []
  }

  $('.slidtop .loop .slide-item').each((_, el) => {
    result.slide.push({
      title: $(el).find('.title .ellipsis a').text().trim(),
      url: $(el).find('.title .ellipsis a').attr('href'),
      image: $(el).find('.poster a img').attr('data-lazy-src') || $(el).find('.poster a img').attr('src'),
      ringkasan: $(el).find('.excerpt .story').text().trim(),
      status: $(el).find('.cast .director strong').text().replace('Status:', '').trim(),
      tipe: $(el).find('.cast .actor strong').text().replace('Tipe:', '').trim()
    })
  })

  $('.listupd.normal .excstf .bs').each((_, el) => {
    result.rilisanTerbaru.push({
      title: $(el).find('.bsx a').attr('title'),
      url: $(el).find('.bsx a').attr('href'),
      image: $(el).find('.bsx a .limit img').attr('data-lazy-src') || $(el).find('.bsx a .limit img').attr('src'),
      episode: $(el).find('.bsx a .bt .epx').text()
    })
  })

  // Mengambil satu genre sebagai contoh agar loading cepat
  $('.series-gen .nav-tabs li a').first().each((_, el) => {
    const genre = $(el).text()
    const animeList = []
    $(`.series-gen .listupd #series-${$(el).attr('href').substring(8)} .bs`).each((__, el2) => {
        animeList.push({
          title: $(el2).find('.bsx a').attr('title'),
          url: $(el2).find('.bsx a').attr('href'),
          image: $(el2).find('.bsx a .limit img').attr('data-lazy-src'),
          episode: $(el2).find('.bsx a .bt .epx').text()
        })
      })
    result.rekomendasiGenre.push({ genre, animeList })
  })

  return result
}

export async function searchAnime(q) {
  if (!q) throw new Error('Query tidak boleh kosong')
  const { data } = await axiosInstance.get(`${baseUrl}/?s=${encodeURIComponent(q)}`)
  const $ = cheerio.load(data)
  const result = []

  $('.listupd > .bs').each((_, el) => {
    result.push({
      title: $(el).find('.bsx > a > .tt > h2').text(),
      url: $(el).find('.bsx > a').attr('href'),
      image: $(el).find('.bsx > a > .limit > img').attr('src')
    })
  })
  return result
}

export async function getDetail(url) {
  if (!url) throw new Error('URL wajib diisi')
  const { data } = await axiosInstance.get(url)
  const $ = cheerio.load(data)

  const result = {
    title: $('.bigcontent .infox .entry-title').text(),
    alternativeTitle: $('.alter').text(),
    status: getInfoText($, 'Status'),
    studio: getInfoText($, 'Studio'),
    releaseDate: $('time').attr('datetime'),
    description: $('.bixbox.synp .entry-content').text().trim(),
    imageUrl: $('.bigcover img').attr('data-lazy-src') || $('.bigcover img').attr('src'),
    episodes: []
  }

  $('.bxcl.epcheck li').each((_, el) => {
    result.episodes.push({
      number: $(el).find('.epl-num').text(),
      title: $(el).find('.epl-title').text(),
      url: $(el).find('a').attr('href'),
      date: $(el).find('.epl-date').text()
    })
  })

  return result
}

export async function getStream(url) {
  if (!url) throw new Error('URL wajib diisi')
  const { data } = await axiosInstance.get(url)
  const $ = cheerio.load(data)

  const result = {
    title: $('h1.entry-title').text(),
    streamingServers: []
  }

  $('.mirror option').each((_, el) => {
    const server = $(el).text().trim()
    const encoded = $(el).attr('value')
    if (!encoded) return

    let link = ''
    try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
        const match = decoded.match(/src="([^"]+)"/i)
        link = match ? match[1] : decoded
    } catch(e) { return }

    result.streamingServers.push({ server, link })
  })

  return result
}

function getInfoText($, label) {
  const text = $(`span:contains("${label}:")`).text()
  return text ? text.replace(`${label}:`, '').trim() : null
}
