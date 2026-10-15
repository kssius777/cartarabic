# Cartarabic

Apprendre l'arabe littéraire en collectionnant des cartes façon Pokémon.

- [Règles du jeu](docs/REGLES.md)
- [Les cartes](data/cartes.json) : arabe vocalisé, translittération, traduction, thème et rareté.

## Jouer

Le jeu se lance dans le navigateur, sur téléphone comme sur ordinateur. La progression est sauvegardée dans le navigateur.

## Développement

```sh
npm install
npm run dev     # lance le jeu en local
npm test        # teste les règles du jeu
npm run build   # prépare la version en ligne dans dist/
```

- `src/game/rules.ts` : toutes les règles (test de niveau, boosters, révisions, punitions).
- `src/components/GameCard.tsx` : le dessin des cartes.
- `src/screens/` : les écrans du jeu.

Le jeu est mis en ligne par Vercel à chaque envoi sur `main`.
