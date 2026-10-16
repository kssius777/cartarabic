import { LANG } from './lang'
import type { Save } from './rules'
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
  return { apikey: ANON_KEY, Authorization: `Bearer ${token ?? ANON_KEY}`, 'Content-Type': 'application/json' }
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
    write(META_KEY, { changedAt: remoteAt, syncedAt: Math.max(remoteAt, Date.now()) })
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
    headers: { ...headers(s.access_token), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId(s.access_token), lang: LANG.id, data: save, updated_at: new Date().toISOString() }),
  })
  if (r.ok) write(META_KEY, { ...getMeta(), syncedAt: Date.now() })
  return r.ok
}

export function lastSync(): number {
  return getMeta().syncedAt
}
