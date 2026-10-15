import { useEffect, useState } from 'react'

/** Photo d'un article de Wikipédia en français, avec de quoi créditer l'auteur (images libres de Wikimedia Commons). */
export interface WikiImage {
  src: string
  page: string
  file: string
  artist: string
  license: string
}

const KEY = 'cartarabic-wiki-v1'
let cache: Record<string, WikiImage | null> | null = null
const pending = new Map<string, Promise<WikiImage | null>>()

function readCache(): Record<string, WikiImage | null> {
  if (cache) return cache
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? '{}') ?? {}
  } catch {
    cache = {}
  }
  return cache!
}

function writeCache(title: string, value: WikiImage | null) {
  const c = readCache()
  c[title] = value
  try {
    localStorage.setItem(KEY, JSON.stringify(c))
  } catch {
    // Stockage plein ou bloqué : l'image sera simplement rechargée la prochaine fois.
  }
}

const stripTags = (html: string) => {
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Si le titre exact n'existe pas, on prend le meilleur résultat de la recherche de Wikipédia. */
async function searchThumb(title: string): Promise<{ thumb?: string; page?: string }> {
  const r = await fetch(
    `https://fr.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(title)}&gsrlimit=1&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=500&format=json&origin=*`,
  )
  const j = await r.json()
  const page = Object.values(j.query?.pages ?? {})[0] as { thumbnail?: { source: string }; fullurl?: string } | undefined
  return { thumb: page?.thumbnail?.source, page: page?.fullurl }
}

async function fetchImage(title: string): Promise<WikiImage | null> {
  const r = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
  let thumb: string | undefined
  let pageUrl: string | undefined
  if (r.ok) {
    const s = await r.json()
    thumb = s.thumbnail?.source
    pageUrl = s.content_urls?.desktop?.page
  } else {
    ;({ thumb, page: pageUrl } = await searchThumb(title))
  }
  if (!thumb) return null
  // Vignette plus grande pour un rendu net sur la carte.
  const src = thumb.replace(/\/(\d+)px-/, '/500px-')
  const parts = decodeURIComponent(thumb).split('/')
  const file = thumb.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1]
  const page = pageUrl ?? `https://fr.wikipedia.org/wiki/${encodeURIComponent(title)}`
  let artist = ''
  let license = ''
  try {
    const m = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(file)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`,
    )
    const j = await m.json()
    const info = Object.values(j.query?.pages ?? {})[0] as { imageinfo?: { extmetadata?: Record<string, { value: string }> }[] }
    const meta = info?.imageinfo?.[0]?.extmetadata ?? {}
    artist = stripTags(meta.Artist?.value ?? '')
    license = stripTags(meta.LicenseShortName?.value ?? '')
  } catch {
    // Le crédit détaillé est un bonus : sans lui on cite Wikimedia Commons.
  }
  return { src, page, file, artist, license }
}

export function loadWikiImage(title: string): Promise<WikiImage | null> {
  const c = readCache()
  if (title in c) return Promise.resolve(c[title])
  let p = pending.get(title)
  if (!p) {
    p = fetchImage(title)
      .then((v) => {
        writeCache(title, v)
        return v
      })
      .catch(() => null)
    pending.set(title, p)
  }
  return p
}

/** undefined = en cours de chargement, null = pas de photo. */
export function useWikiImage(title: string, enabled: boolean): WikiImage | null | undefined {
  const [img, setImg] = useState<WikiImage | null | undefined>(() => {
    if (!enabled) return null
    const c = readCache()
    return title in c ? c[title] : undefined
  })
  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadWikiImage(title).then((v) => {
      if (alive) setImg(v)
    })
    return () => {
      alive = false
    }
  }, [title, enabled])
  return enabled ? img : null
}
