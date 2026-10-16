import type { CSSProperties } from 'react'
import { FIG_CATEGORIES, FIG_RARITIES, FIGURES, type Figure } from '../game/figures'
import { useWikiImage } from '../game/wiki'

interface Props {
  figure: Figure
  width?: string
  copies?: number
  onClick?: () => void
  /** Affiche la traduction française au lieu du texte arabe. */
  french?: boolean
}

/** « Points de renommée », l'équivalent des PV d'une carte Pokémon. */
const FAME: Record<number, number> = { 1: 60, 2: 90, 3: 120, 4: 170, 5: 250 }
const SYMBOL: Record<number, string> = { 1: '●', 2: '◆', 3: '★', 4: '★★', 5: '✦' }

/** Les deux phrases de la description deviennent deux « faits marquants », comme les attaques d'une carte. */
function facts(desc: string): [string, string] {
  const parts = desc.match(/[^.!?]+[.!?]+/g)?.map((p) => p.trim()) ?? [desc]
  return [parts[0] ?? desc, parts.slice(1).join(' ')]
}

export function FigureCard({ figure, width = '220px', copies, onClick, french = false }: Props) {
  const cat = FIG_CATEGORIES[figure.category] ?? FIG_CATEGORIES.lieux
  const rarity = FIG_RARITIES[figure.rarity]
  const img = useWikiImage(figure.wiki, figure.image)
  // Tout est en arabe par défaut ; « Traduire » bascule la carte en français.
  const ar = !french && !!figure.descAr
  const [fact1, fact2] = facts(ar ? figure.descAr! : figure.desc)
  const era = ar ? (figure.eraAr ?? figure.era) : figure.era
  const number = figure.id.replace(/^p0*/, '')
  const style = {
    '--w': width,
    '--cat': cat.color,
    '--rar': rarity.color,
  } as CSSProperties
  return (
    <div className={`fcard r${figure.rarity} ${ar ? 'ar' : ''} ${onClick ? 'clickable' : ''}`} style={style} onClick={onClick}>
      <div className="fcard-frame">
        <div className="fcard-inner" dir={ar ? 'rtl' : 'ltr'}>
          <div className="fcard-stage" lang={ar ? 'ar' : undefined}>
            {ar ? cat.ar : cat.label}
          </div>
          <div className="fcard-head">
            <span className="fcard-name" lang={ar ? 'ar' : undefined}>
              {ar ? figure.ar : figure.name}
            </span>
            <span className="fcard-hp" dir="ltr">
              <small>{ar ? 'شُهْرَة' : 'RN'}</small>
              {FAME[figure.rarity]}
            </span>
            <span className="fcard-icon" title={cat.label}>
              {cat.icon}
            </span>
          </div>
          <div className="fcard-art">
            {img ? (
              <img src={img.src} alt={figure.name} loading="lazy" referrerPolicy="no-referrer" />
            ) : (
              <div className={`fcard-callig ${img === undefined ? 'loading' : ''}`}>
                <span lang="ar" dir="rtl">
                  {figure.ar}
                </span>
              </div>
            )}
            <span className="fcard-foil" />
          </div>
          <div className="fcard-strip" lang={ar ? 'ar' : undefined}>
            {ar ? cat.ar : cat.label} · {era}
          </div>
          {!ar && (
            <div className="fcard-move">
              <span className="fcard-cost">{cat.icon}</span>
              <span className="fcard-move-name" lang="ar" dir="rtl">
                {figure.ar}
              </span>
              <span className="fcard-move-val">{figure.translit}</span>
            </div>
          )}
          <div className="fcard-move fcard-move-text">
            <span className="fcard-cost">
              {cat.icon}
              {cat.icon}
            </span>
            <span lang={ar ? 'ar' : undefined}>{fact1}</span>
          </div>
          <div className="fcard-stats" lang={ar ? 'ar' : undefined}>
            <span>
              <b>{ar ? 'اَلْعَصْرُ' : 'Époque'}</b>
              {era}
            </span>
            <span>
              <b>{ar ? 'اَلْمَجَالُ' : 'Domaine'}</b>
              {cat.icon}
            </span>
            <span>
              <b>{ar ? 'اَلنُّدْرَةُ' : 'Rareté'}</b>
              {ar ? rarity.ar : rarity.name}
            </span>
          </div>
          {fact2 && (
            <div className="fcard-flavor" lang={ar ? 'ar' : undefined}>
              {fact2}
            </div>
          )}
          <div className="fcard-foot" dir="ltr">
            <span>Polyglot · {ar ? 'شَخْصِيَّات' : 'Personnages'}</span>
            <span className="fcard-rarity">
              {number}/{FIGURES.length} {SYMBOL[figure.rarity]}
            </span>
          </div>
          {copies !== undefined && copies > 1 && <span className="fcard-copies">×{copies}</span>}
          <span className="fcard-holo" />
        </div>
      </div>
    </div>
  )
}

/** Crédit de la photo, obligatoire pour les images de Wikimedia Commons. */
export function FigureCredit({ figure }: { figure: Figure }) {
  const img = useWikiImage(figure.wiki, figure.image)
  return (
    <p className="fcredit">
      {img ? (
        <>
          Image :{' '}
          <a href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(img.file)}`} target="_blank" rel="noreferrer">
            {img.artist || 'auteur sur Wikimedia Commons'}
          </a>
          {img.license && ` · ${img.license}`} · via Wikimedia Commons ·{' '}
        </>
      ) : !figure.image ? (
        <>Par respect, pas de représentation : le nom est calligraphié. · </>
      ) : null}
      <a
        href={img?.page ?? `https://fr.wikipedia.org/w/index.php?search=${encodeURIComponent(figure.wiki)}`}
        target="_blank"
        rel="noreferrer"
      >
        Lire sur Wikipédia
      </a>
    </p>
  )
}
