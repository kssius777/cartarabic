import { useEffect, useState, type CSSProperties } from 'react'
import { GameCard } from './components/GameCard'
import { CARDS, RARITIES, type Rarity } from './game/cards'
import { FIGURE_BOOSTER_PRICE, FIGURES } from './game/figures'
import { applyPlacement, dueCount, hasWon, levelGoal, levelUp, newSave, rescue, stats, type Save } from './game/rules'
import { clearSave, loadSave, storeSave } from './game/storage'
import { Binder } from './screens/Binder'
import { BoosterScreen } from './screens/BoosterScreen'
import { Landing } from './screens/Landing'
import { Placement } from './screens/Placement'
import { FiguresScreen } from './screens/FiguresScreen'
import { ReviewScreen } from './screens/ReviewScreen'

type Screen = 'home' | 'booster' | 'review' | 'binder' | 'rules' | 'figures' | 'landing'

export default function App() {
  const [save, setSaveState] = useState<Save>(() => rescue(loadSave()))
  const [screen, setScreen] = useState<Screen>('home')
  const [levelMsg, setLevelMsg] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [testStarted, setTestStarted] = useState(false)

  function setSave(next: Save) {
    const leveled = levelUp(rescue(next))
    if (leveled.level !== next.level && leveled.level) {
      setLevelMsg(`Niveau supérieur ! Les cartes ${RARITIES[leveled.level].name} arrivent dans tes boosters.`)
    }
    setSaveState(leveled)
  }

  useEffect(() => {
    storeSave(save)
  }, [save])
  // Accolades obligatoires : dans les navigateurs récents scrollTo renvoie une promesse, que React prendrait pour une fonction de nettoyage.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const home = () => setScreen('home')

  if (!save.level && !testStarted) return <Landing onStart={() => setTestStarted(true)} />
  if (!save.level) {
    return <Placement onDone={(results) => setSave(applyPlacement(save, results, Date.now()))} />
  }
  if (screen === 'booster') return <BoosterScreen save={save} setSave={setSave} onExit={home} />
  if (screen === 'review') return <ReviewScreen save={save} setSave={setSave} onExit={home} />
  if (screen === 'binder') return <Binder save={save} onExit={home} />
  if (screen === 'rules') return <Rules onExit={home} />
  if (screen === 'landing') return <Landing returning onStart={home} />
  if (screen === 'figures') return <FiguresScreen save={save} setSave={setSave} onExit={home} />

  const s = stats(save)
  const due = dueCount(save, Date.now())
  const level = RARITIES[save.level]
  const next = save.level < 5 ? RARITIES[(save.level + 1) as Rarity] : null
  const { tier, goal: tierGoal } = levelGoal(save.level)
  const tierOwned = tier.filter((c) => save.owned[c.id]).length
  const showcase = CARDS.filter((c) => save.owned[c.id]).slice(-5)

  return (
    <div className="screen center home">
      <header className="appbar">
        <span className="brand">
          Cartarabic <span lang="ar">بِطَاقَات</span>
        </span>
        <span className="appbar-coins">🪙 {save.coins}</span>
      </header>
      <div className="welcome">
        <p className="eyebrow">Ta collection</p>
        <h1>
          {s.owned === 0 ? 'Ouvre ton premier booster.' : due > 0 ? `${due} carte${due > 1 ? 's' : ''} t’attendent.` : 'Tout est à jour.'}
        </h1>
      </div>

      {hasWon(save) && <div className="banner">🏆 Collection complète et brillante ! Tu as gagné.</div>}
      {levelMsg && (
        <div className="banner" onClick={() => setLevelMsg(null)}>
          ⬆️ {levelMsg}
        </div>
      )}

      <section className="trainer" style={{ '--lvl': level.color } as CSSProperties}>
        <div className="lvl-badge">
          <b>{level.name}</b>
          <small>{level.symbol}</small>
        </div>
        <div className="trainer-info">
          <div className="trainer-head">
            <b>Niveau {level.name}</b>
            <span>{level.desc}</span>
          </div>
          {next ? (
            <>
              <div className="bar">
                <div style={{ width: `${Math.min(100, (tierOwned / tierGoal) * 100)}%`, background: next.color }} />
              </div>
              <small className="muted">
                Vers {next.name} : {tierOwned}/{tierGoal} cartes {level.name}
              </small>
            </>
          ) : (
            <small className="muted">Niveau maximum atteint</small>
          )}
        </div>
      </section>

      <div className="chips">
        <span>
          🃏 <b>{s.owned}</b>/{s.total} cartes
        </span>
        <span>
          ✨ <b>{s.brillant}</b> brillante{s.brillant > 1 ? 's' : ''}
        </span>
        <span className="gold-chip">
          🪙 <b>{save.coins}</b> dinars
        </span>
        <span className={due > 0 ? 'hot' : ''}>
          📖 <b>{due}</b> à revoir
        </span>
      </div>

      {showcase.length > 0 && (
        <div className="showcase" onClick={() => setScreen('binder')}>
          {showcase.map((c, k) => (
            <div key={c.id} className="showcase-card" style={{ '--k': k - (showcase.length - 1) / 2 } as CSSProperties}>
              <GameCard card={c} copies={save.owned[c.id].copies} width="var(--sw)" />
            </div>
          ))}
        </div>
      )}

      <div className="menu tiles">
        <button className="tile tile-booster" onClick={() => setScreen('booster')}>
          <span className="tile-icon">🎁</span>
          <span className="tile-text">
            <b>Ouvrir un booster</b>
            <small>10 cartes · illimité</small>
          </span>
          <span className="tile-shine" />
        </button>
        <button className="tile tile-figures" onClick={() => setScreen('figures')}>
          <span className="tile-icon">🕌</span>
          <span className="tile-text">
            <b>Personnages</b>
            <small>
              {Object.keys(save.figures).length}/{FIGURES.length} · booster {FIGURE_BOOSTER_PRICE} 🪙
            </small>
          </span>
        </button>
        <button className="tile tile-review" disabled={s.owned === 0} onClick={() => setScreen('review')}>
          <span className="tile-icon">📖</span>
          <span className="tile-text">
            <b>Réviser</b>
            <small>{due > 0 ? `${due} carte${due > 1 ? 's' : ''} à revoir` : 'Entraîne ta mémoire'}</small>
          </span>
        </button>
        <button className="tile tile-binder" onClick={() => setScreen('binder')}>
          <span className="tile-icon">🗂️</span>
          <span className="tile-text">
            <b>Mon classeur</b>
            <small>
              {s.owned} carte{s.owned > 1 ? 's' : ''}
            </small>
          </span>
        </button>
      </div>

      <div className="foot-links">
        <button className="btn ghost small" onClick={() => setScreen('landing')}>
          Présentation
        </button>
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
      <p>Chaque booster contient 10 cartes face cachée. Trouve ce que veut dire une carte pour la gagner.</p>
      <h3>📖 Révisions</h3>
      <p>
        Une séance tire 15 cartes de ton classeur, en priorité celles à revoir. Plus tu connais une carte, plus la question est dure :
        d'abord arabe → français, puis français → arabe, puis avec des choix qui se ressemblent. La translittération n'apparaît
        qu'avec la réponse.
      </p>
      <p>3 bonnes réponses espacées dans le temps te donnent un exemplaire de plus. Les boosters sont illimités pour l'instant.</p>
      <h3>🪙 Dinars et personnages</h3>
      <p>
        Chaque bonne réponse rapporte 10 dinars. Avec 150 dinars, tu ouvres un booster de 5 personnages : figures, lieux et
        événements du monde musulman et abrahamique, en 5 raretés (bronze, argent, or, platine, légendaire). Par respect, les
        prophètes et les compagnons ne sont jamais représentés : leur nom est calligraphié.
      </p>
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
