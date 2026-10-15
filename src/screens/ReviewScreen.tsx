import { useState } from 'react'
import { OutcomeText, outcomeGlow } from '../components/OutcomeText'
import { QuestionView } from '../components/QuestionView'
import { answerReview, finishReview, makeQuestion, questionTypeFor, reviewSession, type Outcome, type Save } from '../game/rules'
import { Progress } from './Placement'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
}

export function ReviewScreen({ save, setSave, onExit }: Props) {
  const [questions] = useState(() =>
    reviewSession(save, Date.now(), Math.random).map((c) => makeQuestion(c, questionTypeFor(save.owned[c.id]), Math.random)),
  )
  const [i, setI] = useState(0)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const done = i >= questions.length

  function answer(correct: boolean) {
    const r = answerReview(save, questions[i].card, correct, Date.now(), Math.random)
    setSave(r.save)
    setOutcomes((o) => [...o, r.outcome])
  }

  function next() {
    if (i + 1 >= questions.length) setSave(finishReview(save))
    setI(i + 1)
  }

  if (done) {
    const good = outcomes.filter((o) => o.kind === 'progress')
    const gained = good.filter((o) => o.kind === 'progress' && o.gainedCopy).length
    const lost = outcomes.length - good.length
    return (
      <div className="screen center">
        <h2>Révision terminée</h2>
        <p className="big-score">
          {good.length}/{outcomes.length}
        </p>
        <ul className="summary">
          {gained > 0 && <li>🃏 {gained} exemplaire(s) gagné(s)</li>}
          {lost > 0 && <li>💥 {lost} carte(s) oubliée(s) : un exemplaire perdu à chaque fois</li>}
          <li>🎁 +1 booster pour ta séance</li>
        </ul>
        <button className="btn primary big" onClick={onExit}>
          Retour à l'accueil
        </button>
      </div>
    )
  }

  const q = questions[i]
  const outcome = outcomes[i] ?? null
  return (
    <div className="screen">
      <Progress value={i + (outcome ? 1 : 0)} max={questions.length} label="Révision" />
      <QuestionView
        key={q.card.id}
        question={q}
        copies={save.owned[q.card.id]?.copies ?? 0}
        onAnswer={answer}
        feedback={outcome && <OutcomeText outcome={outcome} />}
        glow={outcomeGlow(outcome)}
        onNext={next}
        nextLabel={i + 1 < questions.length ? 'Suivante' : 'Terminer'}
      />
      <button className="btn ghost small quit" onClick={onExit}>
        Arrêter (pas de booster)
      </button>
    </div>
  )
}
