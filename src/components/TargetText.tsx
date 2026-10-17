import type { ReactNode } from 'react'
import { LANG } from '../game/lang'

const STRESSED = /([аеёиоуыэюяАЕЁИОУЫЭЮЯ])́/g

/**
 * Texte dans la langue apprise. En russe, l'accent tonique (U+0301) est dessiné par CSS au-dessus de la voyelle :
 * beaucoup de polices placent mal ce signe combinant, surtout en gras.
 */
export function TargetText({ text }: { text: string }): ReactNode {
  if (LANG.id !== 'ru' || !text.includes('́')) return text
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(STRESSED)) {
    out.push(text.slice(last, m.index))
    out.push(
      <span key={m.index} className={m[1] === m[1].toUpperCase() ? 'stress up' : 'stress'}>
        {m[1]}
        <span className="stress-mark">{'́'}</span>
      </span>,
    )
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return out
}
