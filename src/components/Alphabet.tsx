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

const ALPHABETS: Record<LangId, { letters: Letter[]; marks?: Letter[] }> = {
  ar: { letters: ARABIC, marks: ARABIC_MARKS },
  ru: { letters: RUSSIAN },
  ka: { letters: GEORGIAN },
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
  const { letters, marks } = ALPHABETS[LANG.id]
  const half = Math.ceil(letters.length / 2)
  const name = `Alphabet ${LANG.name.toLowerCase()}`
  const Marks = () =>
    marks ? (
      <>
        <p className="abc-title">Voyelles</p>
        <Grid letters={marks} />
      </>
    ) : null
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
        <p className="abc-title">Alphabet</p>
        <Grid letters={letters} />
        <Marks />
      </aside>
    </>
  )
}
