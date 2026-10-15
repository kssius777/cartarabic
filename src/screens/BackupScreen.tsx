import { useState } from 'react'
import { stats, type Save } from '../game/rules'
import { exportSave, importSave } from '../game/storage'

interface Props {
  save: Save
  onRestore: (s: Save) => void
  onExit: () => void
}

/** Copier sa partie pour la reprendre sur un autre appareil, ou la garder à l'abri. */
export function BackupScreen({ save, onRestore, onExit }: Props) {
  const code = exportSave(save)
  const [copied, setCopied] = useState(false)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<Save | null>(null)
  const [error, setError] = useState(false)
  const mine = stats(save)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      ;(document.getElementById('backup-code') as HTMLTextAreaElement | null)?.select()
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `cartarabic-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function check(value: string) {
    const s = importSave(value)
    setError(!s)
    setPending(s)
  }

  return (
    <div className="screen rules backup">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>Sauvegarde</h2>
      <p className="muted">
        Ta partie est enregistrée dans ce navigateur seulement. Copie ce code pour la reprendre sur ton téléphone ou ton
        ordinateur, ou pour la mettre à l'abri si le navigateur efface ses données.
      </p>
      <h3>📤 Ma partie</h3>
      <p>
        Niveau {save.level ? ['A1', 'A2', 'B1', 'B2', 'C1'][save.level - 1] : '—'} · {mine.owned} cartes · {mine.brillant}{' '}
        brillantes · {Object.keys(save.figures).length} personnages · {save.coins} 🪙
      </p>
      <textarea id="backup-code" className="backup-code" readOnly value={code} rows={3} onFocus={(e) => e.target.select()} />
      <div className="backup-actions">
        <button className="btn primary" onClick={copy}>
          {copied ? '✓ Code copié' : 'Copier le code'}
        </button>
        <button className="btn ghost" onClick={download}>
          Télécharger un fichier
        </button>
      </div>

      <h3>📥 Reprendre une partie</h3>
      <textarea
        className="backup-code"
        rows={3}
        placeholder="Colle ici un code de sauvegarde"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          check(e.target.value)
        }}
      />
      <label className="btn ghost backup-file">
        Ouvrir un fichier
        <input
          type="file"
          accept=".txt,.json,text/plain,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) check(await f.text())
          }}
        />
      </label>
      {error && text.trim() !== '' && <p className="bad">Ce code n'est pas une sauvegarde valide.</p>}
      {pending && (
        <div className="backup-confirm">
          <p>
            Sauvegarde trouvée : {stats(pending).owned} cartes, {Object.keys(pending.figures).length} personnages, {pending.coins}{' '}
            🪙. Elle remplacera ta partie actuelle.
          </p>
          <button className="btn primary" onClick={() => onRestore(pending)}>
            Remplacer ma partie
          </button>
        </div>
      )}
    </div>
  )
}
