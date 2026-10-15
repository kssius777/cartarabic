import { describe, expect, it } from 'vitest'
import { CARDS } from './cards'
import { newSave } from './rules'
import { exportSave, importSave, sanitize } from './storage'

describe('sauvegarde', () => {
  it('répare une sauvegarde abîmée', () => {
    const [a] = CARDS
    const save = sanitize({
      level: 9,
      boosters: 'x',
      owned: { [a.id]: { copies: 2 }, inconnue: { copies: 1, box: 1, due: 0, progress: 0 }, vide: null },
    })
    expect(save.level).toBeNull()
    expect(save.boosters).toBe(0)
    expect(Object.keys(save.owned)).toEqual([a.id])
    expect(save.owned[a.id]).toEqual({ copies: 2, box: 0, due: 0, progress: 0 })
  })

  it('ignore une sauvegarde illisible', () => {
    expect(sanitize('nimporte quoi').owned).toEqual({})
  })
})

describe('export de la sauvegarde', () => {
  it("un code exporté se réimporte à l'identique", () => {
    const save = {
      ...newSave(),
      level: 3 as const,
      coins: 420,
      owned: { [CARDS[0].id]: { copies: 2, box: 3, due: 123, progress: 1 } },
    }
    expect(importSave(exportSave(save))).toEqual(save)
    expect(importSave('nimporte quoi')).toBeNull()
  })
})
