import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { LANG, type LangId } from '../game/lang'

type Letter = [letter: string, sound: string, hint?: string]

/** Les 33 lettres du géorgien moderne (mkhedruli) avec leur son, pour les débutants. */
const GEORGIAN: Letter[] = [
  ['ა', 'a'],
  ['ბ', 'b'],
  ['გ', 'g', 'gare'],
  ['დ', 'd'],
  ['ე', 'e', 'è'],
  ['ვ', 'v'],
  ['ზ', 'z'],
  ['თ', 't', 'soufflé'],
  ['ი', 'i'],
  ['კ', "k'", 'sec'],
  ['ლ', 'l'],
  ['მ', 'm'],
  ['ნ', 'n'],
  ['ო', 'o'],
  ['პ', "p'", 'sec'],
  ['ჟ', 'zh', 'j de jour'],
  ['რ', 'r', 'roulé'],
  ['ს', 's'],
  ['ტ', "t'", 'sec'],
  ['უ', 'u', 'ou'],
  ['ფ', 'p', 'soufflé'],
  ['ქ', 'k', 'soufflé'],
  ['ღ', 'gh', 'r grasseyé'],
  ['ყ', "q'", 'k de gorge'],
  ['შ', 'sh', 'ch'],
  ['ჩ', 'ch', 'tch'],
  ['ც', 'ts'],
  ['ძ', 'dz'],
  ['წ', "ts'", 'sec'],
  ['ჭ', "ch'", 'tch sec'],
  ['ხ', 'kh', 'j espagnol'],
  ['ჯ', 'j', 'dj'],
  ['ჰ', 'h'],
]

/** Les 33 lettres de l'alphabet russe. */
const RUSSIAN: Letter[] = [
  ['Аа', 'a'],
  ['Бб', 'b'],
  ['Вв', 'v'],
  ['Гг', 'g', 'gare'],
  ['Дд', 'd'],
  ['Ее', 'ié'],
  ['Ёё', 'io'],
  ['Жж', 'j', 'jour'],
  ['Зз', 'z'],
  ['Ии', 'i'],
  ['Йй', 'y', 'ail'],
  ['Кк', 'k'],
  ['Лл', 'l'],
  ['Мм', 'm'],
  ['Нн', 'n'],
  ['Оо', 'o', 'a sans accent'],
  ['Пп', 'p'],
  ['Рр', 'r', 'roulé'],
  ['Сс', 's'],
  ['Тт', 't'],
  ['Уу', 'ou'],
  ['Фф', 'f'],
  ['Хх', 'kh', 'j espagnol'],
  ['Цц', 'ts'],
  ['Чч', 'tch'],
  ['Шш', 'ch'],
  ['Щщ', 'chtch', 'ch long'],
  ['Ъъ', '–', 'signe dur'],
  ['Ыы', 'y', 'i sourd'],
  ['Ьь', '–', 'signe mou'],
  ['Ээ', 'è'],
  ['Юю', 'iou'],
  ['Яя', 'ia'],
]

/** Les 28 lettres arabes. */
const ARABIC: Letter[] = [
  ['ا', 'a / ā', 'alif'],
  ['ب', 'b'],
  ['ت', 't'],
  ['ث', 'th', 'anglais think'],
  ['ج', 'j', 'dj'],
  ['ح', 'ḥ', 'h soufflé'],
  ['خ', 'kh', 'j espagnol'],
  ['د', 'd'],
  ['ذ', 'dh', 'anglais this'],
  ['ر', 'r', 'roulé'],
  ['ز', 'z'],
  ['س', 's'],
  ['ش', 'ch'],
  ['ص', 'ṣ', 's appuyé'],
  ['ض', 'ḍ', 'd appuyé'],
  ['ط', 'ṭ', 't appuyé'],
  ['ظ', 'ẓ', 'dh appuyé'],
  ['ع', 'ʿ', 'gorge serrée'],
  ['غ', 'gh', 'r grasseyé'],
  ['ف', 'f'],
  ['ق', 'q', 'k de gorge'],
  ['ك', 'k'],
  ['ل', 'l'],
  ['م', 'm'],
  ['ن', 'n'],
  ['ه', 'h', 'aspiré'],
  ['و', 'w / ū', 'ou'],
  ['ي', 'y / ī', 'i'],
]

/** Les signes des voyelles courtes, posés sur ب. */
const ARABIC_MARKS: Letter[] = [
  ['بَ', 'a', 'fatha'],
  ['بِ', 'i', 'kasra'],
  ['بُ', 'ou', 'damma'],
  ['بْ', 'muette', 'soukoun'],
  ['بّ', 'bb', 'chadda'],
]

/** Le pinyin : les tons d'abord, puis les initiales et les finales qui surprennent un francophone. */
const PINYIN: Letter[] = [
  ['mā', '1er ton', 'plat, haut'],
  ['má', '2e ton', 'monte'],
  ['mǎ', '3e ton', 'descend, remonte'],
  ['mà', '4e ton', 'tombe sec'],
  ['ma', 'neutre', 'court, léger'],
  ['b', 'p', 'sans souffle'],
  ['p', 'p', 'soufflé'],
  ['d', 't', 'sans souffle'],
  ['t', 't', 'soufflé'],
  ['g', 'k', 'sans souffle'],
  ['k', 'k', 'soufflé'],
  ['h', 'kh', 'j espagnol léger'],
  ['j', 'dj', 'doux, langue en avant'],
  ['q', 'tch', 'soufflé, doux'],
  ['x', 'ch', 'doux, sourire'],
  ['zh', 'dj', 'langue retroussée'],
  ['ch', 'tch', 'retroussé, soufflé'],
  ['sh', 'ch', 'langue retroussée'],
  ['r', 'j', 'entre j et r anglais'],
  ['z', 'dz'],
  ['c', 'ts', 'soufflé'],
  ['s', 's'],
  ['u', 'ou'],
  ['ü', 'u', 'u français'],
  ['e', 'eu', 'e du fond'],
  ['i', 'i', 'après zh ch sh r z c s : bourdonné'],
  ['ao', 'ao', 'comme « ciao »'],
  ['ou', 'o-ou'],
  ['ei', 'èï'],
  ['ian', 'iènne'],
  ['ang', 'ang', 'a ouvert + ng'],
  ['ong', 'oung'],
  ['er', 'eur', 'r enroulé'],
]

const ALPHABETS: Record<LangId, { letters: Letter[]; marks?: Letter[]; title?: string }> = {
  ar: { letters: ARABIC, marks: ARABIC_MARKS },
  ru: { letters: RUSSIAN },
  ka: { letters: GEORGIAN },
  zh: { letters: PINYIN, title: 'Pinyin et tons' },
}

function Grid({ letters }: { letters: Letter[] }) {
  return (
    <ul className="abc-grid">
      {letters.map(([l, s, hint]) => (
        <li key={l}>
          <b lang={LANG.id}>{l}</b>
          <span>{s}</span>
          {hint && <small>{hint}</small>}
        </li>
      ))}
    </ul>
  )
}

/**
 * Aide de lecture : l'alphabet entier, à gauche et à droite de la carte sur grand écran, en dessous sur téléphone.
 * Rien de la mise en page de la question ne bouge : sur ordi les colonnes sont posées en position absolue.
 */
export function Alphabet() {
  const { letters, marks, title = 'Alphabet' } = ALPHABETS[LANG.id]
  const half = Math.ceil(letters.length / 2)
  const name = LANG.id === 'zh' ? 'Pinyin et tons' : `Alphabet ${LANG.name.toLowerCase()}`
  const Marks = () =>
    marks ? (
      <>
        <p className="abc-title">Voyelles</p>
        <Grid letters={marks} />
      </>
    ) : null
  const [hidden] = useAbcHidden()
  if (hidden) return null
  return (
    <>
      <aside className="abc abc-side abc-left" aria-label={`${name} (1/2)`}>
        <Grid letters={letters.slice(0, half)} />
      </aside>
      <aside className="abc abc-side abc-right" aria-label={`${name} (2/2)`}>
        <Grid letters={letters.slice(half)} />
        <Marks />
      </aside>
      <aside className="abc abc-below" aria-label={name}>
        <p className="abc-title">{title}</p>
        <Grid letters={letters} />
        <Marks />
      </aside>
    </>
  )
}

const hiddenKey = () => `polyglot-abc-hidden-${LANG.id}`

/** Le choix de masquer l'aide reste mémorisé pour chaque langue. */
function readHidden() {
  try {
    return localStorage.getItem(hiddenKey()) === '1'
  } catch {
    return false
  }
}

function writeHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(hiddenKey(), '1')
    else localStorage.removeItem(hiddenKey())
  } catch {
    // Navigation privée : le choix ne vaudra que pour cette page.
  }
}

const listeners = new Set<(hidden: boolean) => void>()

/** État partagé entre le bouton (dans la barre du haut) et les panneaux de l'alphabet. */
function useAbcHidden(): [boolean, (hidden: boolean) => void] {
  const [hidden, setHidden] = useState(readHidden)
  useEffect(() => {
    listeners.add(setHidden)
    return () => {
      listeners.delete(setHidden)
    }
  }, [])
  return [
    hidden,
    (h) => {
      writeHidden(h)
      listeners.forEach((l) => l(h))
    },
  ]
}

/** Bouton « Masquer / Afficher l'alphabet », posé à côté de la progression. */
export function AlphabetToggle() {
  const [hidden, setHidden] = useAbcHidden()
  const what = LANG.id === 'zh' ? 'le pinyin' : "l'alphabet"
  return (
    <button className={`abc-toggle ${hidden ? 'off' : 'on'}`} onClick={() => setHidden(!hidden)} aria-pressed={!hidden}>
      {hidden ? <Eye size={16} aria-hidden /> : <EyeOff size={16} aria-hidden />}
      <span>{hidden ? `Afficher ${what}` : `Masquer ${what}`}</span>
    </button>
  )
}
