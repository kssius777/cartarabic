import { useEffect, useState } from 'react'
import { GameCard } from './components/GameCard'
import { CARDS, RARITIES } from './game/cards'
import { applyPlacement, dueCount, hasWon, levelUp, newSave, rescue, stats, type Save } from './game/rules'
import { clearSave, loadSave, storeSave } from './game/storage'
import { Binder } from './screens/Binder'
import { BoosterScreen } from './screens/BoosterScreen'
import { Placement } from './screens/Placement'
import { ReviewScreen } from './screens/ReviewScreen'

type Screen = 'home' | 'booster' | 'review' | 'binder' | 'rules'

export default function App() {
  const [save, setSaveState] = useState<Save>(() => rescue(loadSave()))
  const [screen, setScreen] = useState<Screen>('home')
  const [levelMsg, setLevelMsg] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  function setSave(next: Save) {
    const leveled = levelUp(rescue(next))
    if (leveled.level !== next.level && leveled.level) {
      setLevelMsg(`Niveau supérieur ! Les cartes ${RARITIES[leveled.level].name.toLowerCase()}s arrivent dans tes boosters.`)
    }
    setSaveState(leveled)
  }

  useEffect(() => storeSave(save), [save])
  useEffect(() => window.scrollTo(0, 0), [screen])

  const home = () => setScreen('home')

  if (!save.level) {
    return <Placement onDone={(results) => setSave(applyPlacement(save, results, Date.now()))} />
  }
  if (screen === 'booster') return <BoosterScreen save={save} setSave={setSave} onExit={home} />
  if (screen === 'review') return <ReviewScreen save={save} setSave={setSave} onExit={home} />
  if (screen === 'binder') return <Binder save={save} onExit={home} />
  if (screen === 'rules') return <Rules onExit={home} />

  const s = stats(save)
  const due = dueCount(save, Date.now())
  const level = RARITIES[save.level]
  const showcase = CARDS.filter((c) => save.owned[c.id]).slice(-3)

  return (
    <div className="screen center home">
      <h1 className="logo">
        Cartarabic <span lang="ar">بِطَاقَات</span>
      </h1>
      {hasWon(save) && <div className="banner">🏆 Collection complète et brillante ! Tu as gagné.</div>}
      {levelMsg && (
        <div className="banner" onClick={() => setLevelMsg(null)}>
          ⬆️ {levelMsg}
        </div>
      )}
      <div className="stats">
        <div>
          <b>
            {s.owned}/{s.total}
          </b>
          <span>cartes</span>
        </div>
        <div>
          <b>✨ {s.brillant}</b>
          <span>brillantes</span>
        </div>
        <div>
          <b style={{ color: level.color }}>{level.symbol}</b>
          <span>niveau {level.name.toLowerCase()}</span>
        </div>
      </div>
      <div className="bar big">
        <div style={{ width: `${(s.brillant / s.total) * 100}%` }} className="bar-holo" />
        <div style={{ width: `${((s.owned - s.brillant) / s.total) * 100}%` }} />
      </div>

      {showcase.length > 0 && (
        <div className="card-row fan">
          {showcase.map((c) => (
            <GameCard key={c.id} card={c} copies={save.owned[c.id].copies} width="104px" />
          ))}
        </div>
      )}

      <div className="menu">
        <button className="btn primary big" disabled={s.owned === 0} onClick={() => setScreen('review')}>
          📖 Réviser {due > 0 && <span className="badge">{due} à revoir</span>}
        </button>
        <button className="btn gold big" disabled={save.boosters === 0} onClick={() => setScreen('booster')}>
          🎁 Ouvrir un booster <span className="badge">×{save.boosters}</span>
        </button>
        <button className="btn big" onClick={() => setScreen('binder')}>
          🗂️ Mon classeur
        </button>
      </div>
      {save.boosters === 0 && <p className="muted">Termine une révision pour gagner un booster.</p>}
      <div className="foot-links">
        <button className="btn ghost small" onClick={() => setScreen('rules')}>
          Règles
        </button>
        {confirmReset ? (
          <>
            <span className="muted">Tout effacer ?</span>
            <button
              className="btn ghost small danger"
              onClick={() => {
                clearSave()
                setSaveState(newSave())
                setConfirmReset(false)
              }}
            >
              Oui, recommencer
            </button>
            <button className="btn ghost small" onClick={() => setConfirmReset(false)}>
              Annuler
            </button>
          </>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirmReset(true)}>
            Recommencer
          </button>
        )}
      </div>
    </div>
  )
}

function Rules({ onExit }: { onExit: () => void }) {
  return (
    <div className="screen rules">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>Règles</h2>
      <h3>🎁 Boosters</h3>
      <p>Chaque booster contient 5 cartes face cachée. Trouve ce que veut dire une carte pour la gagner.</p>
      <h3>📖 Révisions</h3>
      <p>
        Une séance tire 15 cartes de ton classeur, en priorité celles à revoir. Plus tu connais une carte, plus la question est dure :
        d'abord arabe → français, puis français → arabe, puis sans translittération.
      </p>
      <p>3 bonnes réponses espacées dans le temps te donnent un exemplaire de plus. Chaque séance terminée rapporte un booster.</p>
      <h3>💥 Punition</h3>
      <p>
        Si tu oublies une carte que tu possèdes, tu perds un exemplaire. Si tu rates une carte que tu ne possèdes pas, tu perds un
        exemplaire d'une autre carte au hasard.
      </p>
      <h3>✨ Brillance et victoire</h3>
      <p>À 3 exemplaires, une carte devient brillante. Le but : toute la collection en brillant !</p>
      <h3>🔤 Translittération</h3>
      <p>
        ā ī ū : voyelles longues · u se lit « ou » · ch = ش · kh = خ (j espagnol) · gh = غ (r grasseyé) · th = ث (think) · dh = ذ
        (this) · ḥ = ح (h soufflé) · ʿ = ع (gorge serrée) · ' = ء (coup de glotte) · ṣ ḍ ṭ ẓ = s d t z « lourds » · q = ق (k du
        fond de la gorge)
      </p>
    </div>
  )
}
