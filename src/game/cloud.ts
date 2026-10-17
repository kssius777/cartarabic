import { LANG, type LangId } from './lang'
import { weekStart, weekXp, type Save } from './rules'
import { sanitize } from './storage'

/**
 * Synchronisation de la partie entre appareils, via Supabase (connexion par lien reçu par e-mail).
 * Une ligne par joueur et par langue dans la table `saves`. Sans compte, tout reste dans le navigateur comme avant.
 */
const URL_BASE = 'https://fdjvbgaffuvdfcfmslgz.supabase.co'
// Clé publique « anon » : elle est faite pour être dans le navigateur, les règles RLS protègent les données.
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkanZiZ2FmZnV2ZGZjZm1zbGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxMzIyMDQsImV4cCI6MjEwNzcwODIwNH0.GASXhLbNroswtcVvy68UgmlUERrPcwxqBE0rwq0tzfk'

const SESSION_KEY = 'polyglot-session'
const META_KEY = `polyglot-sync-${LANG.id}`

export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  email: string
}

interface Meta {
  /** Dernière modification locale, et dernier envoi ou réception réussi. */
  changedAt: number
  syncedAt: number
}

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignoré.
  }
}

export const getSession = () => read<Session>(SESSION_KEY)
const getMeta = (): Meta => read<Meta>(META_KEY) ?? { changedAt: 0, syncedAt: 0 }

/** À appeler à chaque modification de la partie. */
export function markChanged(now = Date.now()) {
  write(META_KEY, { ...getMeta(), changedAt: now })
}

function headers(token?: string): Record<string, string> {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${token ?? ANON_KEY}`,
    'Content-Type': 'application/json',
  }
}

/** Envoie le lien de connexion par e-mail. */
export async function sendLoginLink(email: string): Promise<boolean> {
  const redirect = location.origin + location.pathname
  const r = await fetch(`${URL_BASE}/auth/v1/otp?redirect_to=${encodeURIComponent(redirect)}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email, create_user: true }),
  })
  return r.ok
}

function decodeEmail(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return String(payload.email ?? '')
  } catch {
    return ''
  }
}

/** Au retour du lien reçu par e-mail, l'adresse contient les jetons : on les garde et on nettoie l'adresse. */
export function readSessionFromUrl(hash = location.hash): Session | null {
  if (!hash.includes('access_token=')) return null
  const p = new URLSearchParams(hash.slice(1))
  const access_token = p.get('access_token')
  const refresh_token = p.get('refresh_token')
  if (!access_token || !refresh_token) return null
  const session: Session = {
    access_token,
    refresh_token,
    expires_at: Date.now() + Number(p.get('expires_in') ?? 3600) * 1000,
    email: decodeEmail(access_token),
  }
  write(SESSION_KEY, session)
  try {
    history.replaceState(null, '', location.pathname + location.search)
  } catch {
    // Ignoré.
  }
  return session
}

export function logout() {
  write(SESSION_KEY, null)
  write(PROFILE_KEY, null)
}

async function validSession(): Promise<Session | null> {
  const s = getSession()
  if (!s) return null
  if (s.expires_at - Date.now() > 60_000) return s
  const r = await fetch(`${URL_BASE}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ refresh_token: s.refresh_token }),
  })
  if (!r.ok) {
    // Jeton refusé (expiré ou révoqué) : il faudra se reconnecter.
    if (r.status === 400 || r.status === 401) logout()
    return null
  }
  const j = await r.json()
  const next: Session = {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + Number(j.expires_in ?? 3600) * 1000,
    email: j.user?.email ?? s.email,
  }
  write(SESSION_KEY, next)
  return next
}

function userId(token: string): string {
  try {
    return String(JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub)
  } catch {
    return ''
  }
}

/** Nombre de réponses données : sert à départager deux parties modifiées chacune de leur côté. */
export function effort(save: Save): number {
  return Object.values(save.history.days).reduce((n, [, t]) => n + t, 0) + Object.keys(save.owned).length
}

/**
 * Quelle partie garder ? La distante si seule elle a bougé depuis la dernière synchro ;
 * la locale si seule elle a bougé ; si les deux ont bougé, celle où l'on a le plus joué.
 */
export function choose(local: Save, remote: Save, remoteAt: number, meta: Meta): 'local' | 'remote' {
  const remoteChanged = remoteAt > meta.syncedAt
  const localChanged = meta.changedAt > meta.syncedAt
  if (remoteChanged && !localChanged) return 'remote'
  if (localChanged && !remoteChanged) return 'local'
  if (!remoteChanged && !localChanged) return 'local'
  return effort(remote) > effort(local) ? 'remote' : 'local'
}

/** Récupère la partie du compte. Renvoie la partie à utiliser si elle diffère de la locale, sinon null. */
export async function pull(local: Save): Promise<Save | null> {
  const s = await validSession()
  if (!s) return null
  const r = await fetch(`${URL_BASE}/rest/v1/saves?lang=eq.${LANG.id}&select=data,updated_at`, {
    headers: headers(s.access_token),
  })
  if (!r.ok) throw new Error(`pull ${r.status}`)
  const rows = (await r.json()) as { data: unknown; updated_at: string }[]
  const meta = getMeta()
  if (!rows.length) {
    await push(local)
    return null
  }
  const remote = sanitize(rows[0].data)
  const remoteAt = Date.parse(rows[0].updated_at)
  if (choose(local, remote, remoteAt, meta) === 'remote' && remote.level) {
    write(META_KEY, {
      changedAt: remoteAt,
      syncedAt: Math.max(remoteAt, Date.now()),
    })
    return remote
  }
  await push(local)
  return null
}

/** Envoie la partie locale sur le compte. */
export async function push(save: Save): Promise<boolean> {
  const s = await validSession()
  if (!s || !save.level) return false
  const r = await fetch(`${URL_BASE}/rest/v1/saves?on_conflict=user_id,lang`, {
    method: 'POST',
    headers: {
      ...headers(s.access_token),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId(s.access_token),
      lang: LANG.id,
      data: save,
      updated_at: new Date().toISOString(),
    }),
  })
  if (r.ok) write(META_KEY, { ...getMeta(), syncedAt: Date.now() })
  return r.ok
}

export function lastSync(): number {
  return getMeta().syncedAt
}

// ---------- Profil public et classement ----------

export interface Profile {
  user_id: string
  pseudo: string
  avatar: string
}

export interface ScoreRow {
  user_id: string
  lang: LangId
  week_start: string
  week_xp: number
  total_xp: number
  level: number
  cards: number
  profiles?: { pseudo: string; avatar: string } | null
}

export const AVATARS = ['🦊', '🐼', '🐯', '🦉', '🐸', '🐙', '🦁', '🐨', '🐧', '🦄', '🐢', '🐝']
export const PSEUDO_RE = /^[A-Za-z0-9_À-ÿ.-]{3,20}$/

const PROFILE_KEY = 'polyglot-profile'
const PENDING_PSEUDO_KEY = 'polyglot-pending-profile'

/** Profil gardé en cache pour l'afficher sans attendre le réseau. */
export const cachedProfile = () => read<Profile>(PROFILE_KEY)

/** Pseudo choisi avant d'avoir reçu le lien de connexion : on crée le profil au retour. */
export function setPendingProfile(p: { pseudo: string; avatar: string } | null) {
  write(PENDING_PSEUDO_KEY, p)
}

export async function fetchProfile(): Promise<Profile | null> {
  const s = await validSession()
  if (!s) return null
  const r = await fetch(`${URL_BASE}/rest/v1/profiles?user_id=eq.${userId(s.access_token)}&select=user_id,pseudo,avatar`, {
    headers: headers(s.access_token),
  })
  if (!r.ok) throw new Error(`profile ${r.status}`)
  const rows = (await r.json()) as Profile[]
  let profile: Profile | null = rows[0] ?? null
  const pending = read<{ pseudo: string; avatar: string }>(PENDING_PSEUDO_KEY)
  if (!profile && pending) {
    const res = await saveProfile(pending.pseudo, pending.avatar)
    if (res === 'ok') profile = cachedProfile()
  }
  if (profile) setPendingProfile(null)
  write(PROFILE_KEY, profile)
  return profile
}

/** Crée ou modifie son profil. 'taken' si le pseudo est déjà pris. */
export async function saveProfile(pseudo: string, avatar: string): Promise<'ok' | 'taken' | 'invalid' | 'offline'> {
  if (!PSEUDO_RE.test(pseudo)) return 'invalid'
  const s = await validSession()
  if (!s) return 'offline'
  const profile: Profile = { user_id: userId(s.access_token), pseudo, avatar }
  const r = await fetch(`${URL_BASE}/rest/v1/profiles?on_conflict=user_id`, {
    method: 'POST',
    headers: {
      ...headers(s.access_token),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(profile),
  })
  if (r.status === 409) return 'taken'
  if (!r.ok) return 'offline'
  write(PROFILE_KEY, profile)
  return 'ok'
}

/** Publie son score de la langue en cours (seulement avec un profil). */
export async function pushScore(save: Save, now = Date.now()): Promise<boolean> {
  const s = await validSession()
  if (!s || !save.level || !cachedProfile()) return false
  const r = await fetch(`${URL_BASE}/rest/v1/scores?on_conflict=user_id,lang`, {
    method: 'POST',
    headers: {
      ...headers(s.access_token),
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      user_id: userId(s.access_token),
      lang: LANG.id,
      week_start: weekStart(now),
      week_xp: weekXp(save, now),
      total_xp: save.xp,
      level: save.level,
      cards: Object.keys(save.owned).length,
      updated_at: new Date(now).toISOString(),
    }),
  })
  return r.ok
}

/** Les 50 meilleurs de la langue, cette semaine ou depuis toujours. Lisible sans compte. */
export async function leaderboard(kind: 'week' | 'all', now = Date.now()): Promise<ScoreRow[]> {
  const s = await validSession().catch(() => null)
  const filter = kind === 'week' ? `&week_start=eq.${weekStart(now)}&week_xp=gt.0` : '&total_xp=gt.0'
  const order = kind === 'week' ? 'week_xp.desc' : 'total_xp.desc'
  const r = await fetch(
    `${URL_BASE}/rest/v1/scores?lang=eq.${LANG.id}${filter}&order=${order}&limit=50&select=user_id,lang,week_start,week_xp,total_xp,level,cards,profiles(pseudo,avatar)`,
    { headers: headers(s?.access_token) },
  )
  if (!r.ok) throw new Error(`leaderboard ${r.status}`)
  return (await r.json()) as ScoreRow[]
}

/** Profil public d'un joueur : son pseudo et ses scores dans chaque langue. */
export async function publicProfile(id: string): Promise<{ profile: Profile | null; scores: ScoreRow[] }> {
  const s = await validSession().catch(() => null)
  const [p, sc] = await Promise.all([
    fetch(`${URL_BASE}/rest/v1/profiles?user_id=eq.${id}&select=user_id,pseudo,avatar`, { headers: headers(s?.access_token) }),
    fetch(`${URL_BASE}/rest/v1/scores?user_id=eq.${id}&select=user_id,lang,week_start,week_xp,total_xp,level,cards`, {
      headers: headers(s?.access_token),
    }),
  ])
  if (!p.ok || !sc.ok) throw new Error('profile')
  return {
    profile: ((await p.json()) as Profile[])[0] ?? null,
    scores: (await sc.json()) as ScoreRow[],
  }
}

/** Identifiant du compte connecté, pour surligner sa ligne dans le classement. */
export function myId(): string {
  const s = getSession()
  return s ? userId(s.access_token) : ''
}
