import { useState } from 'react'
import { GameCard } from '../components/GameCard'
import { OutcomeText, outcomeGlow } from '../components/OutcomeText'
import { QuestionView } from '../components/QuestionView'
import type { Card } from '../game/cards'
import { answerBooster, consumeBooster, makeQuestion, openBooster, type Outcome, type Question, type Save } from '../game/rules'
import { Progress } from './Placement'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
}

type Stage = 'pack' | 'question' | 'summary'

export function BoosterScreen({ save, setSave, onExit }: Props) {
  const [stage, setStage] = useState<Stage>('pack')
  const [opening, setOpening] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [i, setI] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])

  function tear() {
    if (opening) return
    setOpening(true)
    const drawn = openBooster(save, Math.random)
    setSave(consumeBooster(save))
    setCards(drawn)
    setTimeout(() => show(drawn[0]), 700)
  }

  // Chaque carte arrive directement avec sa question, sans clic pour la retourner.
  function show(card: Card) {
    setQuestion(makeQuestion(card, 'ar-fr', Math.random))
    setStage('question')
  }

  function answer(correct: boolean) {
    const r = answerBooster(save, cards[i], correct, Date.now(), Math.random)
    setSave(r.save)
    setOutcomes((o) => [...o, r.outcome])
  }

  function next() {
    if (i + 1 < cards.length) {
      setI(i + 1)
      show(cards[i + 1])
    } else setStage('summary')
  }

  if (stage === 'pack') {
    return (
      <div className="screen center">
        <h2>Booster</h2>
        <p>5 cartes t'attendent. Pour garder une carte, trouve ce qu'elle veut dire.</p>
        <div className="pack-float">
          <button className={`pack ${opening ? 'opening' : ''}`} onClick={tear} aria-label="Ouvrir le booster">
            <div className="pack-top" />
            <div className="pack-body">
              <span lang="ar">ع</span>
              <b>Cartarabic</b>
              <small>Touche pour ouvrir</small>
            </div>
          </button>
        </div>
        <button className="btn gold big" onClick={tear} disabled={opening}>
          Ouvrir le booster
        </button>
        <button className="btn ghost" onClick={onExit}>
          Retour
        </button>
      </div>
    )
  }

  if (stage === 'summary') {
    const won = outcomes.filter((o) => o.kind === 'won').map((o) => o.card)
    const lost = outcomes.filter((o) => o.kind !== 'won')
    return (
      <div className="screen center">
        <h2>
          {won.length}/{cards.length} cartes gagnées
        </h2>
        {won.length > 0 && (
          <div className="card-row">
            {won.map((c) => (
              <GameCard key={c.id} card={c} copies={save.owned[c.id]?.copies} width="110px" />
            ))}
          </div>
        )}
        {lost.length > 0 && (
          <p className="muted">
            Ratées : {lost.map((o) => `${o.card.ar} (${o.card.fr})`).join(' · ')}. Elles reviendront dans un prochain booster.
          </p>
        )}
        <button className="btn primary big" onClick={onExit}>
          Retour à l'accueil
        </button>
      </div>
    )
  }

  const outcome = outcomes[i] ?? null
  return (
    <div className="screen">
      <Progress value={i + (outcome ? 1 : 0)} max={cards.length} label="Booster" />
      {question && (
        <QuestionView
          key={question.card.id}
          question={question}
          onAnswer={answer}
          feedback={outcome && <OutcomeText outcome={outcome} />}
          glow={outcomeGlow(outcome)}
          onNext={next}
          nextLabel={i + 1 < cards.length ? 'Carte suivante' : 'Voir le résultat'}
        />
      )}
    </div>
  )
}
