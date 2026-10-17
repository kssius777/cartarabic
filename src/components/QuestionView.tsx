import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Card } from '../game/cards'
import type { Question } from '../game/rules'
import { GameCard, type Face } from './GameCard'
import { LANG, TEXT_ATTRS } from '../game/lang'
import { TargetText } from './TargetText'
import { Alphabet } from './Alphabet'

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
  'fr-ar': `Comment dit-on ${LANG.inLang} ?`,
  'fr-ar-nt': `Comment dit-on ${LANG.inLang} ? (difficile)`,
}

// La carte rétrécit sur les petits écrans pour que les réponses et le bouton « Suivante » tiennent sans défiler.
const CARD_WIDTH = 'max(150px, min(64vw, 250px, calc((100dvh - 400px) * 0.716)))'

export function QuestionView({ question, copies, onAnswer, feedback, glow, onNext, nextLabel = 'Continuer' }: Props) {
  const [chosen, setChosen] = useState<Card | null>(null)
  const { card, type, choices } = question
  const toArabic = type.startsWith('fr-ar')
  const answered = chosen !== null
  const afterRef = useRef<HTMLDivElement>(null)

  // Sur téléphone, on s'assure que le bouton « Suivante » reste visible après la réponse.
  useEffect(() => {
    if (answered) afterRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [answered])

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
      <GameCard card={card} face={face} translit={answered} copies={copies} glow={answered ? glow : null} width={CARD_WIDTH} />
      <div className={`choices ${toArabic ? 'choices-ar' : ''}`}>
        {choices.map((c) => {
          const state = !answered ? '' : c.id === card.id ? 'right' : c === chosen ? 'wrong' : 'dim'
          return (
            <button key={c.id} className={`choice ${state}`} onClick={() => choose(c)} disabled={answered && state === 'dim'}>
              {toArabic ? (
                <>
                  <span className="choice-ar" {...TEXT_ATTRS}>
                    <TargetText text={c.ar} />
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
        <div className="after" ref={afterRef}>
          {feedback && <div className="feedback">{feedback}</div>}
          <button className="btn primary" onClick={onNext} autoFocus>
            {nextLabel}
          </button>
        </div>
      )}
      <Alphabet />
    </div>
  )
}
