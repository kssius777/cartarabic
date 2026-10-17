import { useState } from 'react'
import {
  AVATARS,
  cachedProfile,
  getSession,
  PSEUDO_RE,
  saveProfile,
  sendLoginLink,
  setPendingProfile,
  type Profile,
} from '../game/cloud'

interface Props {
  /** Appelé une fois le profil enregistré (connecté) ou le lien envoyé (pas encore connecté). */
  onDone?: (state: 'saved' | 'sent') => void
}

/**
 * Pseudo et avatar pour le classement. Connecté : le profil est enregistré tout de suite.
 * Pas encore connecté : on demande aussi l'e-mail, le profil sera créé au retour du lien.
 */
export function ProfileForm({ onDone }: Props) {
  const current: Profile | null = cachedProfile()
  const connected = !!getSession()
  const [avatar, setAvatar] = useState(current?.avatar ?? AVATARS[0])
  const [pseudo, setPseudo] = useState(current?.pseudo ?? '')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'saved' | 'sent' | 'taken' | 'error'>('idle')
  const valid = PSEUDO_RE.test(pseudo)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setState('busy')
    try {
      if (connected) {
        const r = await saveProfile(pseudo, avatar)
        setState(r === 'ok' ? 'saved' : r === 'taken' ? 'taken' : 'error')
        if (r === 'ok') onDone?.('saved')
      } else {
        setPendingProfile({ pseudo, avatar })
        const ok = await sendLoginLink(email.trim())
        setState(ok ? 'sent' : 'error')
        if (ok) onDone?.('sent')
      }
    } catch {
      setState('error')
    }
  }

  if (state === 'sent')
    return (
      <p className="good profile-sent">
        📬 C'est envoyé ! Ouvre le lien reçu sur <b>{email}</b> depuis cet appareil : ton profil <b>{pseudo}</b> sera créé et ta
        partie sauvegardée.
      </p>
    )

  return (
    <form className="profile-form" onSubmit={submit}>
      <div className="avatar-grid" role="radiogroup" aria-label="Avatar">
        {AVATARS.map((a) => (
          <button
            type="button"
            key={a}
            role="radio"
            aria-checked={a === avatar}
            className={`avatar-pick ${a === avatar ? 'on' : ''}`}
            onClick={() => setAvatar(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <label className="field">
        <span>Pseudo</span>
        <input
          value={pseudo}
          onChange={(e) => {
            setPseudo(e.target.value.trim())
            setState('idle')
          }}
          placeholder="ex. Jijax"
          maxLength={20}
          autoComplete="nickname"
        />
        <small className={pseudo && !valid ? 'bad' : 'muted'}>3 à 20 caractères : lettres, chiffres, _ . -</small>
      </label>
      {!connected && (
        <label className="field">
          <span>E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.fr"
            autoComplete="email"
          />
          <small className="muted">Pas de mot de passe : tu reçois un lien de connexion.</small>
        </label>
      )}
      {state === 'taken' && <p className="bad">Ce pseudo est déjà pris, essaie-en un autre.</p>}
      {state === 'error' && <p className="bad">Ça n'a pas marché. Vérifie ta connexion et réessaie.</p>}
      {state === 'saved' && <p className="good">✓ Profil enregistré.</p>}
      <button className="btn primary big" disabled={!valid || state === 'busy'}>
        {state === 'busy' ? 'Un instant…' : connected ? 'Enregistrer mon profil' : 'Créer mon profil'}
      </button>
    </form>
  )
}
