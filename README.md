# OVH Cost Manager

Application FinOps pour suivre les couts, factures, consommations et ressources OVHcloud depuis une base SQLite locale alimentee par l'API OVH.

L'application expose une API Node/Express et un dashboard React. Elle peut tourner en local pour le developpement ou en Docker avec import automatique.

## Fonctionnalites

- Tableau de bord des couts par mois ou par annee.
- Analyse Cloud vs Bare Metal.
- Detail par projet Public Cloud, service, type de ressource et ligne de facture.
- Page projets avec instances, quotas, buckets Object Storage et Cold Archive.
- Tendances mensuelles avec graphiques pleins.
- Consommation courante, prevision de fin de mois et historique reconstruit depuis les factures si necessaire.
- Inventaire OVH : serveurs dedies, VPS, buckets Public Cloud, projets Cloud et expirations proches.
- Facturation : liste des factures, details, paiements et solde du compte.
- Interface FR/EN, theme clair/sombre, selection de mois ou d'annee complete.
- Exports CSV et outils CLI pour les factures.
- Auth OIDC optionnelle et rate limiting configurable.

## Architecture

```text
.
├── dashboard/          # Frontend React + Vite
├── server/             # API Express et service des fichiers statiques du dashboard
├── data/               # Import OVH, schema SQLite, acces aux donnees
├── cli/                # Outils CLI historiques autour des factures
├── scripts/            # Entrypoint Docker et import periodique
├── tests/              # Tests Jest backend/data
├── docker-compose.yml  # Deploiement sans SSO
└── docker-compose.sso.yml
```

La base de donnees est stockee dans `DATA_DIR/ovh-bills.db`. En Docker, le volume par defaut est `ocm-data` monte dans `/app/data`.

## Prerequis

- Node.js 20 recommande.
- npm.
- Docker et Docker Compose pour le deploiement conteneurise.
- Identifiants API OVH avec les droits de lecture necessaires.

## Configuration OVH

Copier l'exemple :

```bash
cp config.example.json config.json
```

Renseigner les credentials OVH :

```json
{
  "credentials": {
    "appKey": "YOUR_APP_KEY",
    "appSecret": "YOUR_APP_SECRET",
    "consumerKey": "YOUR_CONSUMER_KEY",
    "endpoint": "ovh-eu"
  },
  "dataDir": "/app/data",
  "dashboard": {
    "budget": 50000,
    "currency": "EUR",
    "language": "fr"
  }
}
```

`DATA_DIR` peut aussi etre fourni par variable d'environnement. Il prend le dessus sur `dataDir`.

### Droits API conseilles

Pour un inventaire complet, le consumer key OVH doit pouvoir lire :

```text
/me
/me/*
/cloud
/cloud/*
/dedicated/server
/dedicated/server/*
/vps
/vps/*
/storage
/storage/*
/ip
/ip/*
/ipLoadbalancing
/ipLoadbalancing/*
```

Les droits minimum pour les couts et factures sont `/me/*` et `/cloud/*`. Les autres chemins enrichissent l'inventaire.

## Demarrage local

Installer les dependances :

```bash
npm install
```

Importer les donnees :

```bash
npm run import:full
```

Lancer API et frontend Vite :

```bash
npm run dev
```

Par defaut :

- API : `http://localhost:3001`
- Frontend Vite : `http://localhost:5173`

Pour lancer uniquement le serveur API qui sert aussi le build du dashboard :

```bash
npm run build
PORT=3001 npm run dev:server
```

## Demarrage Docker

Creer `config.json`, puis lancer :

```bash
docker compose up -d --build
```

Ouvrir :

```text
http://localhost:3001
```

Le conteneur lance le serveur et un import periodique via `scripts/cron-import.sh`.

Variables utiles :

| Variable | Description | Defaut |
| --- | --- | --- |
| `OCM_PORT` | Port expose sur l'hote | `3001` |
| `PORT` | Port interne Express | `3001` |
| `IMPORT_ENABLED` | Active l'import periodique | `true` |
| `IMPORT_INTERVAL` | Intervalle entre imports, en secondes | `86400` |
| `IMPORT_FLAGS` | Flags passes a `data/import.js` | `--all` |
| `DATA_DIR` | Dossier contenant `ovh-bills.db` | `data/` ou `/app/data` |
| `RATE_LIMIT_ENABLED` | Active le rate limiting API | `true` |
| `TRUST_PROXY` | Active la confiance proxy | `false` |

## Imports

Commandes principales :

```bash
# Import complet
npm run import:full

# Import differentiel depuis la derniere facture connue
npm run import:diff

# Import d'une periode
npm run import -- --from 2026-01-01 --to 2026-12-31

# Import avec donnees enrichies
node data/import.js --diff --include-account
node data/import.js --diff --include-inventory
node data/import.js --diff --include-cloud-details
node data/import.js --diff --all
```

En Docker :

```bash
docker exec ovh-finops node data/import.js --diff --all
```

Les flags enrichis alimentent notamment :

- `--include-account` : solde, credits, dettes, informations de paiement.
- `--include-inventory` : serveurs dedies, VPS, stockage NetApp.
- `--include-cloud-details` : instances, quotas, buckets, consommation Public Cloud courante.
- `--all` : active toutes les donnees enrichies.

## Pages principales

| Page | Role |
| --- | --- |
| `/` | Vue executive : cout total, part Cloud, projets, services et ressources dominantes |
| `/projects` | Liste des projets Public Cloud avec cout de la periode |
| `/projects/:id` | Detail projet : instances, quotas, buckets, consommation |
| `/costs/services` | Analyse par service et type de ressource |
| `/trends` | Evolution historique sur 3 a 36 mois |
| `/compare` | Comparaison de deux mois |
| `/consumption` | Consommation courante, periode selectionnee et historique |
| `/inventory` | Inventaire OVH et expirations proches |
| `/bills` | Factures, details et solde du compte |

Le selecteur en haut a droite permet de choisir un mois ou une annee complete. Les pages de couts utilisent cette periode pour les requetes `from/to`.

## Tests et validation

Frontend :

```bash
npm run test --workspace=dashboard
```

Backend/data :

```bash
npx jest tests
```

Build :

```bash
npm run build
```

## Donnees et depannage

Verifier le volume Docker :

```bash
docker volume inspect ocm-data
```

Verifier la base SQLite :

```bash
sqlite3 /var/lib/docker/volumes/ocm-data/_data/ovh-bills.db \
  "select count(*) from bills; select count(*) from bill_details;"
```

Si une page affiche `0` alors que les donnees existent chez OVH :

1. Relancer l'import enrichi adapte.
2. Verifier que le serveur utilise le bon `DATA_DIR`.
3. Controler l'endpoint API correspondant.

Exemples :

```bash
DATA_DIR=/var/lib/docker/volumes/ocm-data/_data node data/import.js --diff --all
DATA_DIR=/var/lib/docker/volumes/ocm-data/_data PORT=3001 npm run dev:server

curl -s "http://localhost:3001/api/inventory/summary"
curl -s "http://localhost:3001/api/projects/enriched?from=2026-01-01&to=2026-12-31"
```

## SSO et production

Le fichier `docker-compose.sso.yml` ajoute une integration LemonLDAP-NG et Traefik. Voir `docs/deployment.md` pour le detail du mode SSO.

Pour une mise en production :

- monter `config.json` en lecture seule ;
- persister le volume `ocm-data` ;
- activer `TRUST_PROXY=true` derriere un reverse proxy ;
- ajuster `RATE_LIMIT_*` selon le contexte ;
- proteger l'acces avec OIDC/SSO ou un reverse proxy d'entreprise ;
- planifier un import periodique avec `IMPORT_FLAGS=--all`.

## Licence

MIT. Voir `LICENSE.txt`.
