import { useRef, type CSSProperties, type PointerEvent } from 'react'
import { LANG, TEXT_ATTRS } from '../game/lang'

interface Props {
  opening: boolean
  onOpen: () => void
  count?: number
}

/**
 * Booster en relief : un sachet en aluminium qui suit le doigt ou la souris,
 * avec un reflet qui glisse, des bords sertis et une ouverture qui déchire le haut.
 */
export function BoosterPack({ opening, onOpen, count = 10 }: Props) {
  const ref = useRef<HTMLButtonElement>(null)

  function tilt(e: PointerEvent<HTMLButtonElement>) {
    const el = ref.current
    if (!el || opening) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', `${(0.5 - y) * 18}deg`)
    el.style.setProperty('--ry', `${(x - 0.5) * 22}deg`)
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
  }

  function reset() {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--mx', '50%')
    el.style.setProperty('--my', '30%')
  }

  return (
    <div className={`bpack-scene ${opening ? 'opening' : ''}`}>
      <button
        ref={ref}
        className="bpack"
        onClick={onOpen}
        onPointerMove={tilt}
        onPointerLeave={reset}
        aria-label="Ouvrir le booster"
        style={{ '--mx': '50%', '--my': '30%' } as CSSProperties}
      >
        <span className="bpack-crimp top" />
        <span className="bpack-foil">
          <span className="bpack-rings" />
          <span className="bpack-brand">POLYGLOT</span>
          <span className="bpack-glyph" {...TEXT_ATTRS}>
            {LANG.glyph}
          </span>
          <span className="bpack-name">
            <b>Booster · {LANG.name}</b>
            <small>{count} cartes · niveau adapté</small>
          </span>
          <span className="bpack-count">{count}</span>
          <span className="bpack-sheen" />
        </span>
        <span className="bpack-crimp bottom" />
      </button>
      <span className="bpack-burst" aria-hidden />
    </div>
  )
}
