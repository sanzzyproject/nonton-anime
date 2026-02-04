import axios from 'axios'
import * as cheerio from 'cheerio'

const baseUrl = 'https://v3.animekompi.fun'

const axiosInstance = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Referer': baseUrl
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

  return result
}

export async function searchAnime(q) {
  if (!q) throw new Error('Query kosong')
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
  if (!url) throw new Error('URL wajib')
  const { data } = await axiosInstance.get(url)
  const $ = cheerio.load(data)

  const result = {
    title: $('.bigcontent .infox .entry-title').text(),
    status: getInfoText($, 'Status'),
    studio: getInfoText($, 'Studio'),
    description: $('.bixbox.synp .entry-content').text().trim(),
    imageUrl: $('.bigcover img').attr('data-lazy-src') || $('.bigcover img').attr('src'),
    episodes: []
  }

  // Mengambil SEMUA episode yang terlist
  $('.bxcl.epcheck li').each((_, el) => {
    result.episodes.push({
      number: $(el).find('.epl-num').text(),
      title: $(el).find('.epl-title').text(),
      url: $(el).find('a').attr('href'),
      date: $(el).find('.epl-date').text()
    })
  })

  // Balik urutan agar Episode 1 di awal (opsional, tergantung selera, tapi biasanya user suka urut)
  // result.episodes.reverse(); 

  return result
}

export async function getStream(url) {
  if (!url) throw new Error('URL wajib')
  const { data } = await axiosInstance.get(url)
  const $ = cheerio.load(data)

  const result = {
    title: $('h1.entry-title').text(),
    streamingServers: []
  }

  // Logika Ekstraksi Server yang lebih kuat
  $('.mirror option').each((_, el) => {
    const serverName = $(el).text().trim().split(' ')[0]; // Ambil nama server saja
    const encoded = $(el).attr('value')
    if (!encoded) return

    let link = ''
    try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
        // Cek pola src="..."
        const srcMatch = decoded.match(/src="([^"]+)"/i)
        // Cek pola iframe src="..."
        const iframeMatch = decoded.match(/<iframe[^>]+src="([^"]+)"/i)
        
        if (srcMatch) link = srcMatch[1]
        else if (iframeMatch) link = iframeMatch[1]
        else link = decoded // Fallback jika direct link
        
    } catch(e) { return }

    // Filter link kosong atau error
    if(link.startsWith('http')) {
        result.streamingServers.push({ server: serverName, link })
    }
  })

  return result
}

function getInfoText($, label) {
  const text = $(`span:contains("${label}:")`).text()
  return text ? text.replace(`${label}:`, '').trim() : 'N/A'
}
