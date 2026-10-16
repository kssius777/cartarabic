/** Les 33 lettres du géorgien moderne (mkhedruli) avec leur son, pour les débutants. */
const LETTERS: [letter: string, sound: string, hint?: string][] = [
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

function Grid({ letters }: { letters: typeof LETTERS }) {
  return (
    <ul className="abc-grid">
      {letters.map(([l, s, hint]) => (
        <li key={l}>
          <b lang="ka">{l}</b>
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
export function GeorgianAlphabet() {
  return (
    <>
      <aside className="abc abc-side abc-left" aria-label="Alphabet géorgien (1/2)">
        <Grid letters={LETTERS.slice(0, 17)} />
      </aside>
      <aside className="abc abc-side abc-right" aria-label="Alphabet géorgien (2/2)">
        <Grid letters={LETTERS.slice(17)} />
      </aside>
      <aside className="abc abc-below" aria-label="Alphabet géorgien">
        <p className="abc-title">Alphabet</p>
        <Grid letters={LETTERS} />
      </aside>
    </>
  )
}
