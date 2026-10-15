import type { CSSProperties } from "react";
import { FIG_CATEGORIES, FIG_RARITIES, type Figure } from "../game/figures";
import { useWikiImage } from "../game/wiki";

interface Props {
  figure: Figure;
  width?: string;
  copies?: number;
  onClick?: () => void;
}

export function FigureCard({
  figure,
  width = "220px",
  copies,
  onClick,
}: Props) {
  const cat = FIG_CATEGORIES[figure.category] ?? FIG_CATEGORIES.lieux;
  const rarity = FIG_RARITIES[figure.rarity];
  const img = useWikiImage(figure.wiki, figure.image);
  const style = {
    "--w": width,
    "--cat": cat.color,
    "--rar": rarity.color,
  } as CSSProperties;
  return (
    <div
      className={`fcard r${figure.rarity} ${onClick ? "clickable" : ""}`}
      style={style}
      onClick={onClick}
    >
      <div className="fcard-frame">
        <div className="fcard-inner">
          <div className="fcard-head">
            <span className="fcard-name">{figure.name}</span>
            <span className="fcard-icon" title={cat.label}>
              {cat.icon}
            </span>
          </div>
          <div className="fcard-art">
            {img ? (
              <img
                src={img.src}
                alt={figure.name}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`fcard-callig ${img === undefined ? "loading" : ""}`}
              >
                <span lang="ar" dir="rtl">
                  {figure.ar}
                </span>
              </div>
            )}
          </div>
          <div className="fcard-ar" lang="ar" dir="rtl">
            {figure.ar}
          </div>
          <div className="fcard-translit">{figure.translit}</div>
          <div className="fcard-foot">
            <span>{figure.era}</span>
            <span className="fcard-rarity">{rarity.name}</span>
          </div>
          {copies !== undefined && copies > 1 && (
            <span className="fcard-copies">×{copies}</span>
          )}
          <span className="fcard-holo" />
        </div>
      </div>
    </div>
  );
}

/** Crédit de la photo, obligatoire pour les images de Wikimedia Commons. */
export function FigureCredit({ figure }: { figure: Figure }) {
  const img = useWikiImage(figure.wiki, figure.image);
  return (
    <p className="fcredit">
      {img ? (
        <>
          Image :{" "}
          <a
            href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(img.file)}`}
            target="_blank"
            rel="noreferrer"
          >
            {img.artist || "auteur sur Wikimedia Commons"}
          </a>
          {img.license && ` · ${img.license}`} · via Wikimedia Commons ·{" "}
        </>
      ) : !figure.image ? (
        <>Par respect, pas de représentation : le nom est calligraphié. · </>
      ) : null}
      <a
        href={
          img?.page ??
          `https://fr.wikipedia.org/w/index.php?search=${encodeURIComponent(figure.wiki)}`
        }
        target="_blank"
        rel="noreferrer"
      >
        Lire sur Wikipédia
      </a>
    </p>
  );
}
