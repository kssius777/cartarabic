import { newSave, type Save } from './rules'

const KEY = 'cartarabic-save-v1'

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const save = JSON.parse(raw) as Save
      if (save.version === 1) return save
    }
  } catch {
    // Stockage indisponible (navigation privée…) : on repart d'une partie neuve.
  }
  return newSave()
}

export function storeSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {
    // Ignoré : la partie continue sans sauvegarde.
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Ignoré.
  }
}
