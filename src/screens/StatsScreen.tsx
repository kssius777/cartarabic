import { useState, type CSSProperties } from 'react'
import { CARDS, RARITIES, THEMES, type Card, type Rarity } from '../game/cards'
import { cardsToWork, dayKey, isBrillant, REVIEW_SIZE, type Save, type Tally } from '../game/rules'

interface Props {
  save: Save
  onExit: () => void
  onWork: (cards: Card[]) => void
}

const DAY = 86_400_000
const PAGE = 30
/** En dessous de ce nombre de réponses, un taux de réussite ne veut pas dire grand-chose. */
const MIN_ANSWERS = 5

const pct = ([c, t]: Tally) => (t ? Math.round((c / t) * 100) : 0)
const sum = (tallies: Tally[]): Tally => tallies.reduce<Tally>(([c, t], [c2, t2]) => [c + c2, t + t2], [0, 0])

export function StatsScreen({ save, onExit, onWork }: Props) {
  const [limit, setLimit] = useState(PAGE)
  const now = Date.now()
  const owned = Object.values(save.owned)
  const mastered = owned.filter(isBrillant).length
  const learning = owned.length - mastered
  const work = cardsToWork(save)
  const all = sum(Object.values(save.history.days))

  const last = Array.from({ length: 14 }, (_, k) => {
    const t = now - (13 - k) * DAY
    return { t, tally: save.history.days[dayKey(t)] ?? ([0, 0] as Tally) }
  })
  const week = sum(last.slice(-7).map((d) => d.tally))
  const today = last[last.length - 1].tally
  const peak = Math.max(1, ...last.map((d) => d.tally[1]))

  const themes = Object.entries(save.history.themes)
    .filter(([key, t]) => THEMES[key] && t[1] >= MIN_ANSWERS)
    .sort((a, b) => pct(a[1]) - pct(b[1]))
  const weakest = themes.slice(0, 5)

  return (
    <div className="screen stats-page">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>Statistiques</h2>

      <div className="stat-grid">
        <div className="stat">
          <b>{mastered}</b>
          <span>✨ maîtrisées</span>
        </div>
        <div className="stat">
          <b>{learning}</b>
          <span>🃏 en cours</span>
        </div>
        <div className="stat hot">
          <b>{work.length}</b>
          <span>🎯 à travailler</span>
        </div>
        <div className="stat">
          <b>{all[1] ? `${pct(all)} %` : '—'}</b>
          <span>✅ de réussite</span>
        </div>
      </div>

      <section className="stat-block">
        <h3>14 derniers jours</h3>
        {all[1] === 0 ? (
          <p className="muted">Réponds à quelques cartes pour voir ta courbe apparaître.</p>
        ) : (
          <>
            <div className="days">
              {last.map(({ t, tally }) => (
                <div key={t} className="day" title={`${new Date(t).toLocaleDateString('fr-FR')} : ${tally[0]}/${tally[1]}`}>
                  <div className="day-bar" style={{ '--h': `${(tally[1] / peak) * 100}%` } as CSSProperties}>
                    <div className="day-ok" style={{ height: `${tally[1] ? (tally[0] / tally[1]) * 100 : 0}%` }} />
                  </div>
                  <small>{new Date(t).toLocaleDateString('fr-FR', { weekday: 'narrow' })}</small>
                </div>
              ))}
            </div>
            <p className="muted">
              Aujourd'hui : {today[0]}/{today[1]}
              {today[1] > 0 && ` (${pct(today)} %)`} · 7 jours : {week[0]}/{week[1]}
              {week[1] > 0 && ` (${pct(week)} %)`}
            </p>
          </>
        )}
      </section>

      <section className="stat-block">
        <h3>Par niveau</h3>
        {([1, 2, 3, 4, 5] as Rarity[]).map((r) => {
          const tier = CARDS.filter((c) => c.rarity === r)
          const have = tier.filter((c) => save.owned[c.id]).length
          const tally = save.history.levels[r] ?? [0, 0]
          return (
            <div key={r} className="level-row">
              <span className="level-name" style={{ color: RARITIES[r].color }}>
                {RARITIES[r].name}
              </span>
              <div className="bar">
                <div style={{ width: `${(have / tier.length) * 100}%`, background: RARITIES[r].color }} />
              </div>
              <span className="level-figs">
                {have}/{tier.length}
                <small>{tally[1] >= MIN_ANSWERS ? `${pct(tally)} % juste` : ''}</small>
              </span>
            </div>
          )
        })}
      </section>

      {weakest.length > 0 && (
        <section className="stat-block">
          <h3>Thèmes à renforcer</h3>
          {weakest.map(([key, tally]) => (
            <div key={key} className="level-row">
              <span className="level-name">
                {THEMES[key].icon} {THEMES[key].label}
              </span>
              <div className="bar">
                <div style={{ width: `${pct(tally)}%`, background: THEMES[key].color }} />
              </div>
              <span className="level-figs">{pct(tally)} %</span>
            </div>
          ))}
        </section>
      )}

      <section className="stat-block">
        <div className="work-head">
          <h3>Cartes à travailler</h3>
          {work.length > 0 && (
            <button className="btn primary" onClick={() => onWork(work.slice(0, REVIEW_SIZE).map((w) => w.card))}>
              Réviser les {Math.min(REVIEW_SIZE, work.length)} plus ratées
            </button>
          )}
        </div>
        {work.length === 0 ? (
          <p className="muted">
            Aucune pour l'instant : chaque carte ratée apparaîtra ici jusqu'à ce qu'elle devienne brillante.
          </p>
        ) : (
          <ul className="work-list">
            {work.slice(0, limit).map(({ card, fails }) => (
              <li key={card.id}>
                <span className="work-ar" lang="ar" dir="rtl">
                  {card.ar}
                </span>
                <span className="work-fr">
                  {card.fr}
                  <small>{card.translit}</small>
                </span>
                <span className="work-meta">
                  <b>✗ {fails}</b>
                  <small>{save.owned[card.id] ? `${save.owned[card.id].copies} ex.` : 'pas au classeur'}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
        {work.length > limit && (
          <button className="btn ghost" onClick={() => setLimit(limit + PAGE)}>
            Voir plus ({work.length - limit} restantes)
          </button>
        )}
      </section>
    </div>
  )
}
