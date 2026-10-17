import { useState } from "react";
import { LANG, LANGS, switchLang, type LangId } from "../game/lang";

/** Bouton de langue : chaque langue garde sa propre collection, on passe de l'une à l'autre sans rien perdre. */
export function LangPicker() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="lang-btn"
        onClick={() => setOpen(true)}
        aria-label="Changer de langue"
      >
        <span>{LANG.flag}</span> {LANG.name}{" "}
        <span className="lang-caret">▾</span>
      </button>
      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div
            className="modal-body lang-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Quelle langue ?</h3>
            <p className="muted">
              Chaque langue a sa propre collection, son niveau et ses
              statistiques.
            </p>
            {(Object.keys(LANGS) as LangId[]).map((id) => {
              const l = LANGS[id];
              return (
                <button
                  key={id}
                  className={`lang-option ${id === LANG.id ? "on" : ""}`}
                  onClick={() =>
                    id === LANG.id ? setOpen(false) : switchLang(id)
                  }
                >
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-names">
                    <b>{l.name}</b>
                    <span lang={id} dir={l.dir}>
                      {l.native}
                    </span>
                  </span>
                  {id === LANG.id && <span className="lang-check">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
