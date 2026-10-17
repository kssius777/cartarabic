import { useEffect, useState } from 'react'
import { getSession, leaderboard, myId, publicProfile, type Profile, type ScoreRow } from '../game/cloud'
import { LANG, LANGS } from '../game/lang'
import { RARITIES, type Rarity } from '../game/cards'
import { weekXp, type Save } from '../game/rules'

interface Props {
  save: Save
  onExit: () => void
  onAccount: () => void
}

/** Classement de la langue : XP de la semaine (remis à zéro le lundi) ou depuis le début. */
export function LeaderboardScreen({ save, onExit, onAccount }: Props) {
  const [kind, setKind] = useState<'week' | 'all'>('week')
  const [rows, setRows] = useState<ScoreRow[] | null>(null)
  const [error, setError] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const me = myId()

  useEffect(() => {
    let live = true
    setRows(null)
    setError(false)
    leaderboard(kind)
      .then((r) => live && setRows(r))
      .catch(() => live && setError(true))
    return () => {
      live = false
    }
  }, [kind])

  return (
    <div className="screen board">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>
        Classement {LANG.flag} {LANG.name}
      </h2>
      <div className="board-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={kind === 'week'}
          className={kind === 'week' ? 'on' : ''}
          onClick={() => setKind('week')}
        >
          Cette semaine
        </button>
        <button role="tab" aria-selected={kind === 'all'} className={kind === 'all' ? 'on' : ''} onClick={() => setKind('all')}>
          Depuis toujours
        </button>
      </div>
      <p className="muted board-me">
        Toi : <b>{kind === 'week' ? weekXp(save, Date.now()) : save.xp} XP</b> · 10 XP par bonne réponse
        {kind === 'week' && ', remis à zéro chaque lundi'}
      </p>
      {!getSession() && (
        <button className="banner board-join" onClick={onAccount}>
          Crée ton profil pour apparaître dans le classement <b>→</b>
        </button>
      )}
      {error && <p className="bad">Impossible de charger le classement. Vérifie ta connexion.</p>}
      {!rows && !error && <p className="muted">Chargement…</p>}
      {rows && rows.length === 0 && (
        <p className="muted">Personne encore cette semaine. Réponds à quelques cartes pour être premier !</p>
      )}
      {rows && rows.length > 0 && (
        <ol className="board-list">
          {rows.map((r, i) => (
            <li key={r.user_id} className={r.user_id === me ? 'me' : ''}>
              <button onClick={() => setOpen(r.user_id)}>
                <span className={`board-rank r${i + 1}`}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
                <span className="board-avatar">{r.profiles?.avatar ?? '🙂'}</span>
                <span className="board-name">
                  <b>{r.profiles?.pseudo ?? 'Joueur'}</b>
                  <small>
                    Niveau {RARITIES[(r.level || 1) as Rarity].name} · {r.cards} cartes
                  </small>
                </span>
                <span className="board-xp">{kind === 'week' ? r.week_xp : r.total_xp} XP</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {open && <PublicProfile id={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

/** Fiche publique d'un joueur : avatar, pseudo, et sa progression dans chaque langue. */
function PublicProfile({ id, onClose }: { id: string; onClose: () => void }) {
  const [data, setData] = useState<{
    profile: Profile | null
    scores: ScoreRow[]
  } | null>(null)
  useEffect(() => {
    publicProfile(id)
      .then(setData)
      .catch(() => setData({ profile: null, scores: [] }))
  }, [id])
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-body lang-sheet profile-card" onClick={(e) => e.stopPropagation()}>
        {!data ? (
          <p className="muted">Chargement…</p>
        ) : (
          <>
            <span className="profile-avatar">{data.profile?.avatar ?? '🙂'}</span>
            <h3>{data.profile?.pseudo ?? 'Joueur'}</h3>
            <ul className="profile-langs">
              {data.scores.map((s) => (
                <li key={s.lang}>
                  <span>{LANGS[s.lang]?.flag}</span>
                  <b>{LANGS[s.lang]?.name}</b>
                  <span>Niveau {RARITIES[(s.level || 1) as Rarity].name}</span>
                  <span>{s.cards} cartes</span>
                  <span>{s.total_xp} XP</span>
                </li>
              ))}
            </ul>
            <button className="btn" onClick={onClose}>
              Fermer
            </button>
          </>
        )}
      </div>
    </div>
  )
}
