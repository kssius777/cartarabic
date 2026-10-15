import { useState } from "react";
import { EmptySlot, GameCard } from "../components/GameCard";
import { CARDS, RARITIES, THEMES, type Card, type Rarity } from "../game/cards";
import {
  BRILLANT,
  isBrillant,
  PROGRESS_FOR_COPY,
  stats,
  type Save,
} from "../game/rules";

type Filter = "all" | "owned" | "brillant";
const PAGE = 120;

export function Binder({ save, onExit }: { save: Save; onExit: () => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [theme, setTheme] = useState<string | null>(null);
  const [level, setLevel] = useState<Rarity | null>(null);
  // Avec des milliers de cartes, on n'affiche qu'une page à la fois pour rester fluide sur téléphone.
  const [limit, setLimit] = useState(PAGE);
  const [open, setOpen] = useState<Card | null>(null);
  const [flipped, setFlipped] = useState(false);
  const s = stats(save);

  const shown = CARDS.filter((c) => {
    const o = save.owned[c.id];
    if (theme && c.theme !== theme) return false;
    if (level && c.rarity !== level) return false;
    if (filter === "owned") return !!o;
    if (filter === "brillant") return isBrillant(o);
    return true;
  });

  const o = open ? save.owned[open.id] : undefined;
  return (
    <div className="screen wide">
      <div className="binder-head">
        <button className="btn ghost small" onClick={onExit}>
          ← Accueil
        </button>
        <h2>Classeur</h2>
        <span className="muted">
          {s.owned}/{s.total} · ✨ {s.brillant}
        </span>
      </div>
      <div className="chips">
        {(["all", "owned", "brillant"] as Filter[]).map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? "on" : ""}`}
            onClick={() => {
              setFilter(f);
              setLimit(PAGE);
            }}
          >
            {{ all: "Toutes", owned: "Possédées", brillant: "Brillantes" }[f]}
          </button>
        ))}
      </div>
      <div className="chips">
        <button
          className={`chip ${level === null ? "on" : ""}`}
          onClick={() => {
            setLevel(null);
            setLimit(PAGE);
          }}
        >
          Tous niveaux
        </button>
        {([1, 2, 3, 4, 5] as Rarity[]).map((r) => (
          <button
            key={r}
            className={`chip ${level === r ? "on" : ""}`}
            onClick={() => {
              setLevel(r);
              setLimit(PAGE);
            }}
          >
            {RARITIES[r].symbol} {RARITIES[r].name}
          </button>
        ))}
      </div>
      <div className="chips">
        <button
          className={`chip ${theme === null ? "on" : ""}`}
          onClick={() => {
            setTheme(null);
            setLimit(PAGE);
          }}
        >
          Tous thèmes
        </button>
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            className={`chip ${theme === key ? "on" : ""}`}
            onClick={() => {
              setTheme(key);
              setLimit(PAGE);
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div className="binder-grid">
        {shown.slice(0, limit).map((c) =>
          save.owned[c.id] ? (
            <GameCard
              key={c.id}
              card={c}
              copies={save.owned[c.id].copies}
              width="100%"
              onClick={() => {
                setOpen(c);
                setFlipped(false);
              }}
            />
          ) : (
            <EmptySlot key={c.id} card={c} />
          ),
        )}
        {shown.length === 0 && (
          <p className="muted">Aucune carte ici pour l'instant.</p>
        )}
      </div>
      {shown.length > limit && (
        <button className="btn big more" onClick={() => setLimit(limit + PAGE)}>
          Voir plus ({shown.length - limit} restantes)
        </button>
      )}

      {open && o && (
        <div className="modal" onClick={() => setOpen(null)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <GameCard
              card={open}
              copies={o.copies}
              face={flipped ? "back" : "front"}
              width="min(72vw, 300px)"
              onClick={() => setFlipped(!flipped)}
            />
            <p className="muted">Touche la carte pour la retourner.</p>
            <p>
              {o.copies >= BRILLANT
                ? "✨ Brillante : tu la connais par cœur."
                : `${o.copies}/${BRILLANT} exemplaires · progression ${o.progress}/${PROGRESS_FOR_COPY}`}
            </p>
            <p className="muted">
              {o.due <= Date.now()
                ? "À revoir maintenant"
                : `Prochaine révision ${when(o.due)}`}
            </p>
            <button className="btn primary" onClick={() => setOpen(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function when(t: number) {
  const mins = Math.round((t - Date.now()) / 60000);
  if (mins < 60) return `dans ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `dans ${hours} h`;
  return `dans ${Math.round(hours / 24)} j`;
}
