import { Coins } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { FigureCard, FigureCredit } from '../components/FigureCard'
import { FIG_CATEGORIES, FIG_RARITIES, FIGURE_BOOSTER_PRICE, FIGURE_BOOSTER_SIZE, FIGURES, type Figure } from '../game/figures'
import { buyFigureBooster, COINS_PER_CORRECT, type Save } from '../game/rules'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
}

const PAGE = 60

export function FiguresScreen({ save, setSave, onExit }: Props) {
  const [tab, setTab] = useState<'shop' | 'collection'>('shop')
  const [drawn, setDrawn] = useState<Figure[] | null>(null)
  const [revealed, setRevealed] = useState<number[]>([])
  const [open, setOpen] = useState<Figure | null>(null)
  const [cat, setCat] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const [french, setFrench] = useState(() => {
    try {
      return localStorage.getItem('cartarabic-fig-fr') === '1'
    } catch {
      return false
    }
  })

  function toggleFrench() {
    setFrench(!french)
    try {
      localStorage.setItem('cartarabic-fig-fr', french ? '0' : '1')
    } catch {
      // Préférence non retenue si le stockage est bloqué.
    }
  }

  const ownedCount = Object.keys(save.figures).length
  const canBuy = save.coins >= FIGURE_BOOSTER_PRICE

  function buy() {
    const r = buyFigureBooster(save, Math.random)
    if (!r) return
    setSave(r.save)
    setDrawn(r.figures)
    setRevealed([])
  }

  const shown = FIGURES.filter((f) => !cat || f.category === cat)

  return (
    <div className="screen wide figures">
      <div className="binder-head">
        <button className="btn ghost small" onClick={onExit}>
          ← Accueil
        </button>
        <h2>Personnages</h2>
        <span className="coins">
          <Coins size={15} aria-hidden /> {save.coins}
        </span>
      </div>
      <button className={`btn small translate ${french ? 'on' : ''}`} onClick={toggleFrench}>
        {french ? "عَرَبِيٌّ · Revenir à l'arabe" : '🌐 Traduire en français'}
      </button>
      <div className="chips">
        <button className={`chip ${tab === 'shop' ? 'on' : ''}`} onClick={() => setTab('shop')}>
          🛍️ Boutique
        </button>
        <button className={`chip ${tab === 'collection' ? 'on' : ''}`} onClick={() => setTab('collection')}>
          📜 Collection {ownedCount}/{FIGURES.length}
        </button>
      </div>

      {tab === 'shop' && !drawn && (
        <div className="shop">
          <div className="fpack">
            <span className="fpack-star" aria-hidden="true">
              ۞
            </span>
            <b>Personnages</b>
            <span lang="ar">شَخْصِيَّات</span>
            <small>{FIGURE_BOOSTER_SIZE} cartes</small>
          </div>
          <button className="btn gold big" disabled={!canBuy} onClick={buy}>
            Acheter pour {FIGURE_BOOSTER_PRICE} dinars
          </button>
          <p className="muted">
            {canBuy
              ? 'Figures, lieux et événements du monde musulman et abrahamique, avec photos de Wikipédia.'
              : `Il te manque ${FIGURE_BOOSTER_PRICE - save.coins} dinars. Chaque bonne réponse en booster ou en révision rapporte ${COINS_PER_CORRECT} dinars.`}
          </p>
          <div className="odds">
            {([1, 2, 3, 4, 5] as const).map((r) => (
              <span key={r} style={{ '--rar': FIG_RARITIES[r].color } as CSSProperties}>
                {FIG_RARITIES[r].name}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === 'shop' && drawn && (
        <div className="reveal">
          <p className="muted">Touche une carte pour la découvrir.</p>
          <div className="reveal-grid">
            {drawn.map((f, i) =>
              revealed.includes(i) ? (
                <div key={i} className="reveal-in">
                  <FigureCard figure={f} width="100%" french={french} onClick={() => setOpen(f)} />
                  {save.figures[f.id] === 1 && <span className="new-tag">Nouveau !</span>}
                </div>
              ) : (
                <button key={i} className="fback" onClick={() => setRevealed([...revealed, i])} aria-label="Découvrir la carte">
                  <span>۞</span>
                </button>
              ),
            )}
          </div>
          <div className="reveal-actions">
            {revealed.length < drawn.length ? (
              <button className="btn" onClick={() => setRevealed(drawn.map((_, i) => i))}>
                Tout révéler
              </button>
            ) : (
              <>
                <button className="btn gold" disabled={!canBuy} onClick={buy}>
                  Encore un ({FIGURE_BOOSTER_PRICE} dinars)
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setDrawn(null)
                    setTab('collection')
                  }}
                >
                  Voir ma collection
                </button>
                <button className="btn ghost" onClick={() => setDrawn(null)}>
                  Retour à la boutique
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'collection' && (
        <>
          <div className="chips">
            <button
              className={`chip ${cat === null ? 'on' : ''}`}
              onClick={() => {
                setCat(null)
                setLimit(PAGE)
              }}
            >
              Toutes
            </button>
            {Object.entries(FIG_CATEGORIES).map(([key, c]) => (
              <button
                key={key}
                className={`chip ${cat === key ? 'on' : ''}`}
                onClick={() => {
                  setCat(key)
                  setLimit(PAGE)
                }}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <div className="fgrid">
            {shown.slice(0, limit).map((f) =>
              save.figures[f.id] ? (
                <FigureCard
                  key={f.id}
                  figure={f}
                  width="100%"
                  french={french}
                  copies={save.figures[f.id]}
                  onClick={() => setOpen(f)}
                />
              ) : (
                <div key={f.id} className="fslot" style={{ '--rar': FIG_RARITIES[f.rarity].color } as CSSProperties}>
                  <span>{FIG_CATEGORIES[f.category]?.icon ?? '?'}</span>
                  <small>{FIG_RARITIES[f.rarity].name}</small>
                </div>
              ),
            )}
          </div>
          {shown.length > limit && (
            <button className="btn big more" onClick={() => setLimit(limit + PAGE)}>
              Voir plus ({shown.length - limit} restantes)
            </button>
          )}
        </>
      )}

      {open && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="modal-body fmodal" onClick={(e) => e.stopPropagation()}>
            <FigureCard figure={open} width="min(70vw, 280px)" french={french} />
            <button className="btn small translate" onClick={toggleFrench}>
              {french ? 'عَرَبِيٌّ' : '🌐 Traduire'}
            </button>
            {open.descAr && !french ? (
              <p lang="ar" dir="rtl" className="fdesc-ar">
                {open.descAr}
              </p>
            ) : (
              <p>{open.desc}</p>
            )}
            <p className="muted">
              {open.name} · {open.translit}
            </p>
            <FigureCredit figure={open} />
            <button className="btn primary" onClick={() => setOpen(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
