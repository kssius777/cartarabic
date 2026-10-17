import { useState } from "react";
import { ProfileForm } from "../components/ProfileForm";

/** Fin de l'accueil : après le premier booster, on propose de créer son profil. */
export function SignupScreen({ onExit }: { onExit: () => void }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="screen onb">
      <section className="onb-step">
        <div className="onb-ask">
          <span className="onb-mascot" aria-hidden>
            🦊
          </span>
          <p className="onb-bubble">
            Bravo pour ton premier booster ! Crée ton profil pour garder tes
            cartes sur tous tes appareils et entrer dans le classement.
          </p>
        </div>
        <ProfileForm onDone={(s) => s === "sent" && setSent(true)} />
        <button className="btn ghost" onClick={onExit}>
          {sent ? "Continuer" : "Plus tard"}
        </button>
      </section>
    </div>
  );
}
