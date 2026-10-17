import { useState } from 'react'
import { stats, type Save } from '../game/rules'
import { exportSave, importSave } from '../game/storage'
import { getSession, lastSync, logout, pull, push, sendLoginLink } from '../game/cloud'
import { LANG } from '../game/lang'
import { ProfileForm } from '../components/ProfileForm'

interface Props {
  save: Save
  onRestore: (s: Save) => void
  onExit: () => void
  /** Partie récupérée depuis le compte. */
  onCloud: (s: Save) => void
}

/** Copier sa partie pour la reprendre sur un autre appareil, ou la garder à l'abri. */
export function BackupScreen({ save, onRestore, onExit, onCloud }: Props) {
  const code = exportSave(save)
  const [copied, setCopied] = useState(false)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<Save | null>(null)
  const [error, setError] = useState(false)
  const mine = stats(save)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      ;(document.getElementById('backup-code') as HTMLTextAreaElement | null)?.select()
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cartarabic-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function check(value: string) {
    const s = importSave(value)
    setError(!s)
    setPending(s)
  }

  return (
    <div className="screen rules backup">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>Compte et sauvegarde</h2>
      <Account save={save} onCloud={onCloud} />
      <p className="muted">
        Sans compte, ta partie reste dans ce navigateur. Tu peux aussi copier ce code pour la reprendre ailleurs ou la mettre à
        l'abri si le navigateur efface ses données.
      </p>
      <h3>📤 Ma partie</h3>
      <p>
        Niveau {save.level ? ['A1', 'A2', 'B1', 'B2', 'C1'][save.level - 1] : '—'} · {mine.owned} cartes · {mine.brillant}{' '}
        brillantes · {Object.keys(save.figures).length} personnages · {save.coins} 🪙
      </p>
      <textarea id="backup-code" className="backup-code" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
      <div className="backup-actions">
        <button className="btn primary" onClick={copy}>
          {copied ? '✓ Code copié' : 'Copier le code'}
        </button>
        <button className="btn ghost" onClick={download}>
          Télécharger un fichier
        </button>
      </div>

      <h3>📥 Reprendre une partie</h3>
      <textarea
        className="backup-code"
        rows={3}
        placeholder="Colle ici un code de sauvegarde"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          check(e.target.value)
        }}
      />
      <label className="btn ghost backup-file">
        Ouvrir un fichier
        <input
          type="file"
          accept=".txt,.json,text/plain,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) check(await f.text())
          }}
        />
      </label>
      {error && text.trim() !== '' && <p className="bad">Ce code n'est pas une sauvegarde valide.</p>}
      {pending && (
        <div className="backup-confirm">
          <p>
            Sauvegarde trouvée : {stats(pending).owned} cartes, {Object.keys(pending.figures).length} personnages, {pending.coins}{' '}
            🪙. Elle remplacera ta partie actuelle.
          </p>
          <button className="btn primary" onClick={() => onRestore(pending)}>
            Remplacer ma partie
          </button>
        </div>
      )}
    </div>
  )
}

/** Connexion par lien envoyé par e-mail, puis synchronisation automatique entre téléphone et ordinateur. */
function Account({ save, onCloud }: { save: Save; onCloud: (s: Save) => void }) {
  const [session, setSession] = useState(getSession)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'syncing' | 'error'>('idle')
  const [synced, setSynced] = useState(lastSync)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setState('sending')
    try {
      setState((await sendLoginLink(email.trim())) ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  async function syncNow() {
    setState('syncing')
    try {
      const remote = await pull(save)
      if (remote) onCloud(remote)
      else await push(save)
      setSynced(lastSync())
      setState('idle')
    } catch {
      setState('error')
    }
    setSession(getSession())
  }

  if (session) {
    return (
      <section className="account">
        <h3>☁️ Mon compte</h3>
        <p>
          Connecté avec <b>{session.email || 'ton adresse'}</b>. Ta partie {LANG.inLang} se synchronise toute seule entre ton
          téléphone et ton ordinateur.
        </p>
        <h3>Mon profil public</h3>
        <p className="muted">Ton pseudo et ton avatar apparaissent dans le classement.</p>
        <ProfileForm />
        <p className="muted">
          {synced
            ? `Dernière synchro : ${new Date(synced).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`
            : 'Pas encore synchronisé.'}
        </p>
        {state === 'error' && <p className="bad">La synchro n'a pas marché. Réessaie dans un instant.</p>}
        <div className="backup-actions">
          <button className="btn primary" onClick={syncNow} disabled={state === 'syncing'}>
            {state === 'syncing' ? 'Synchro…' : 'Synchroniser maintenant'}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              logout()
              setSession(null)
            }}
          >
            Se déconnecter
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="account">
      <h3>☁️ Mon compte</h3>
      <p>
        Connecte-toi pour retrouver ta partie sur ton téléphone et ton ordinateur. Pas de mot de passe : tu reçois un lien par
        e-mail.
      </p>
      {state === 'sent' ? (
        <p className="good">C'est envoyé ! Ouvre le lien reçu sur {email} depuis cet appareil.</p>
      ) : (
        <form className="account-form" onSubmit={send}>
          <input
            type="email"
            required
            placeholder="ton@email.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <button className="btn primary" disabled={state === 'sending'}>
            {state === 'sending' ? 'Envoi…' : 'Recevoir le lien'}
          </button>
        </form>
      )}
      {state === 'error' && <p className="bad">L'envoi n'a pas marché. Vérifie l'adresse et réessaie.</p>}
    </section>
  )
}
