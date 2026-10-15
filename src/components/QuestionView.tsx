import { useState, type ReactNode } from 'react'
import type { Card } from '../game/cards'
import type { Question } from '../game/rules'
import { GameCard, type Face } from './GameCard'

interface Props {
  question: Question
  copies?: number
  /** Appelé une seule fois quand on choisit une réponse. */
  onAnswer: (correct: boolean) => void
  /** Message affiché après la réponse (gain ou punition). */
  feedback?: ReactNode
  glow?: 'win' | 'lose' | null
  onNext: () => void
  nextLabel?: string
}

const PROMPTS = {
  'ar-fr': 'Que veut dire cette carte ?',
  'ar-fr-nt': 'Que veut dire cette carte ? (difficile)',
  'fr-ar': 'Comment dit-on en arabe ?',
  'fr-ar-nt': 'Comment dit-on en arabe ? (difficile)',
}

export function QuestionView({ question, copies, onAnswer, feedback, glow, onNext, nextLabel = 'Continuer' }: Props) {
  const [chosen, setChosen] = useState<Card | null>(null)
  const { card, type, choices } = question
  const toArabic = type.startsWith('fr-ar')
  const answered = chosen !== null

  // Avant la réponse on montre le côté de la question ; après, la carte se retourne.
  const promptFace: Face = toArabic ? 'back' : 'front'
  const face: Face = answered ? (toArabic ? 'front' : 'back') : promptFace

  function choose(c: Card) {
    if (answered) return
    setChosen(c)
    onAnswer(c.id === card.id)
  }

  return (
    <div className="question">
      <p className="prompt">{PROMPTS[type]}</p>
      <GameCard card={card} face={face} translit={answered} copies={copies} glow={answered ? glow : null} width="min(64vw, 250px)" />
      <div className={`choices ${toArabic ? 'choices-ar' : ''}`}>
        {choices.map((c) => {
          const state = !answered ? '' : c.id === card.id ? 'right' : c === chosen ? 'wrong' : 'dim'
          return (
            <button key={c.id} className={`choice ${state}`} onClick={() => choose(c)} disabled={answered && state === 'dim'}>
              {toArabic ? (
                <>
                  <span className="choice-ar" lang="ar" dir="rtl">
                    {c.ar}
                  </span>
                  {answered && <span className="choice-sub">{c.translit}</span>}
                </>
              ) : (
                c.fr
              )}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className="after">
          {feedback && <div className="feedback">{feedback}</div>}
          <button className="btn primary" onClick={onNext} autoFocus>
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}
