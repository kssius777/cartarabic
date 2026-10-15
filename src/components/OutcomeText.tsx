import type { Outcome } from '../game/rules'
import { BRILLANT, PROGRESS_FOR_COPY } from '../game/rules'

export function outcomeGlow(o: Outcome | null): 'win' | 'lose' | null {
  if (!o) return null
  return o.kind === 'won' || o.kind === 'progress' ? 'win' : 'lose'
}

export function OutcomeText({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case 'won':
      return (
        <p className="good">
          🎉 Carte gagnée ! {outcome.copies > 1 && `(${outcome.copies} exemplaires)`}
        </p>
      )
    case 'progress':
      if (outcome.gainedCopy && outcome.copies >= BRILLANT) return <p className="good">✨ Carte brillante ! Tu la connais par cœur.</p>
      if (outcome.gainedCopy) return <p className="good">🃏 +1 exemplaire ({outcome.copies}/{BRILLANT})</p>
      return (
        <p className="good">
          ✅ Bien joué !{' '}
          {outcome.copies < BRILLANT && (
            <span className="muted">
              Progression {outcome.progress}/{PROGRESS_FOR_COPY}
            </span>
          )}
        </p>
      )
    case 'lost-copy':
      return outcome.copiesLeft > 0 ? (
        <p className="bad">
          💥 Oubliée ! Tu perds un exemplaire (il en reste {outcome.copiesLeft}).
        </p>
      ) : (
        <p className="bad">💥 Oubliée ! La carte quitte ton classeur.</p>
      )
    case 'lost-other':
      return outcome.lost ? (
        <p className="bad">
          💥 Raté ! En punition, tu perds un exemplaire de « {outcome.lost.fr} »
          {outcome.copiesLeft === 0 ? ', qui quitte ton classeur.' : '.'}
        </p>
      ) : (
        <p className="bad">💥 Raté ! Cette carte t'échappe.</p>
      )
  }
}
