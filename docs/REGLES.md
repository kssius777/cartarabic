# Règles du jeu : les cartes d'arabe

Version 1, appliquée dans le jeu. Les cartes sont dans [cartes.json](../data/cartes.json).

## Les cartes

- Chaque carte est un mot ou une phrase en **arabe littéraire**, écrit avec toutes ses voyelles (harakat).
- **Recto** : l'arabe en grand, et la translittération dessous une fois la réponse donnée. **Verso** : la traduction en français.
- Chaque carte a un **thème**, qui joue le rôle du « type » Pokémon (couleur, symbole et illustration du cadre) :
  salutations, pronoms, famille, nourriture, maison, corps, nature, animaux, nombres, couleurs, temps, ville, adjectifs, questions, verbes, expressions, phrases.
- Chaque carte a une **rareté**, liée à sa difficulté :

| Rareté (niveau CECRL) | Symbole | Contenu typique |
|---|---|---|
| A1 (débutant) | ● | mots très courants et courts |
| A2 (élémentaire) | ◆ | mots du quotidien |
| B1 (intermédiaire) | ★ | mots moins fréquents, premières phrases courtes |
| B2 (intermédiaire avancé) | ★★ | verbes conjugués, phrases utiles |
| C1 (avancé) | ★★★ | phrases complètes de la vie courante |

- On peut posséder **plusieurs exemplaires** de la même carte. Les exemplaires servent de « vies » pour cette carte.

## 1. Test de niveau (au premier lancement)

- 12 cartes, de la plus facile à la plus difficile (environ 2 à 3 par rareté).
- Pour chaque carte, on voit l'arabe et la translittération, et on choisit la bonne traduction parmi 4.
- Ton niveau est la rareté la plus haute où tu as au moins 2 bonnes réponses, en t'arrêtant au premier palier raté.
- Pas de punition pendant le test.
- Ton niveau débloque les boosters de cette rareté et en dessous. Les cartes réussies pendant le test sont offertes.

## 2. Ouvrir un booster

- Un booster contient 10 cartes : 7 de ton niveau ou en dessous, 2 de ton niveau, et 1 chance sur 10 d'avoir une carte du niveau au-dessus.
- Chaque carte arrive **face cachée** : on voit l'arabe, il faut trouver la traduction (choix parmi 4).
  - Bonne réponse : la carte est **gagnée** et va dans le classeur.
  - Mauvaise réponse : la carte est montrée avec sa traduction, puis **perdue**. Elle reviendra dans un prochain booster.
- Les boosters sont illimités pour l'instant. Si on n'a plus ni carte ni booster, on reçoit un booster pour ne pas rester bloqué.
- **Montée de niveau** : quand tu possèdes au moins la moitié des cartes de ta rareté maximale, tu passes au niveau suivant.

## 3. Réviser (le cœur du jeu)

- Une séance tire environ 15 cartes **au hasard** dans ton classeur, en favorisant celles qui sont « à revoir » (répétition espacée : une carte bien connue revient de moins en moins souvent, une carte ratée revient vite).
- Les questions deviennent plus dures avec la maîtrise de la carte :
  1. arabe → choisir la traduction (4 choix) ;
  2. français → choisir l'arabe (4 choix) ;
  3. arabe → choisir la traduction parmi des cartes qui se ressemblent (même thème) ;
  4. français → retrouver l'arabe parmi des cartes qui se ressemblent.
- La translittération est cachée pendant la question et n'apparaît qu'avec la réponse.
- **Bonne réponse** : la carte progresse. Après 3 bonnes réponses espacées dans le temps (une réponse ne compte que si la carte était « à revoir »), tu gagnes **un exemplaire de plus**.
- Délais avant de revoir une carte : immédiat, 10 min, 1 jour, 3 jours, 7 jours, 14 jours, 30 jours (doublés pour une carte brillante).
- **Oubli (mauvaise réponse)** : la punition.
  - Si tu possèdes cette carte : **un exemplaire est défaussé**. Si c'était le dernier, la carte quitte le classeur et redevient à gagner.
  - Si tu ne la possèdes pas (carte de booster ou de test) : **une autre carte au hasard est retirée** de ton classeur.

## 4. Brillance et victoire

- Une carte possédée en **3 exemplaires** devient **brillante** (version holographique) : elle est considérée comme retenue.
- Une carte brillante reste en révision, mais beaucoup plus rarement. Si tu l'oublies, elle perd un exemplaire et sa brillance.
- **But du jeu** : avoir toute la collection en version brillante.

## Translittération

Convention simple pour un francophone :

- **ā, ī, ū** : voyelles longues ; **u** se lit « ou ».
- **ch** = ش (ch français), **kh** = خ (j espagnol), **gh** = غ (r grasseyé), **th** = ث (th anglais de *think*), **dh** = ذ (th anglais de *this*).
- **ḥ** = ح (h soufflé du fond de la gorge), **ʿ** = ع (contraction de la gorge), **'** = ء (coup de glotte).
- **ṣ, ḍ, ṭ, ẓ** : versions « lourdes » de s, d, t, z. **q** = ق (k du fond de la gorge).
