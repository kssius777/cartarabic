import { Component, type ReactNode } from "react";
import { clearSave } from "../game/storage";

interface State {
  error: Error | null;
}

/** Si le jeu plante, on affiche l'erreur au lieu d'une page blanche. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  // Les erreurs dans les boutons (clics, minuteries) ne passent pas par React : on les attrape aussi.
  private onError = (e: ErrorEvent) =>
    this.setState({
      error: e.error instanceof Error ? e.error : new Error(e.message),
    });
  private onRejection = (e: PromiseRejectionEvent) =>
    this.setState({
      error: e.reason instanceof Error ? e.reason : new Error(String(e.reason)),
    });

  componentDidMount() {
    window.addEventListener("error", this.onError);
    window.addEventListener("unhandledrejection", this.onRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.onError);
    window.removeEventListener("unhandledrejection", this.onRejection);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="screen center">
        <h2>Oups, le jeu a planté</h2>
        <p>
          Envoie une capture de cet écran pour que le problème soit corrigé.
        </p>
        <pre className="error-box">
          {error.message}
          {"\n"}
          {error.stack?.split("\n").slice(0, 4).join("\n")}
          {"\n"}
          {navigator.userAgent}
        </pre>
        <button className="btn primary big" onClick={() => location.reload()}>
          Recharger
        </button>
        <button
          className="btn ghost small"
          onClick={() => {
            clearSave();
            location.reload();
          }}
        >
          Effacer ma partie et recommencer
        </button>
      </div>
    );
  }
}
