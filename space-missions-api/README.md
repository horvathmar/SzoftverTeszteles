# 🚀 Space Missions API

Egyszerű CRUD REST API űrmissziók nyilvántartásához (Express 5 + MongoDB/Mongoose), Jest unit tesztekkel.

## Indítás

```bash
npm install
cp .env.example .env     # állítsd be a DATABASE_URL értékét
npm start
```

## Tesztek futtatása

```bash
npm test                 # unit tesztek (adatbázis NEM kell hozzá)
npm run test:coverage    # lefedettségi riport
```

A unit tesztek a Mongoose modellt `jest.mock`-kal helyettesítik, így nincs szükség MongoDB-re,
hálózatra vagy futó szerverre.

## Misszió dokumentum

| Mező        | Típus  | Kötelező | Megjegyzés                                      |
|-------------|--------|----------|-------------------------------------------------|
| name        | String | igen     | A misszió neve                                  |
| destination | String | igen     | Célpont (Hold, Mars, Europa…)                   |
| status      | String | nem      | `planned` (alap), `launched`, `completed`, `failed` |
| crewSize    | Number | igen     | Legénység létszáma, min. 0                      |
| launchDate  | Date   | nem      | Indulás dátuma                                  |

## Végpontok

| Metódus | URL            | Leírás                                   | Sikeres kód |
|---------|----------------|------------------------------------------|-------------|
| POST    | /api           | Új misszió felvitele                     | 201         |
| GET     | /api           | Összes misszió (opcionális `?status=`)   | 200         |
| GET     | /api/:id       | Adott ID-jű misszió                      | 200         |
| PATCH   | /api/:id       | Adott ID-jű misszió részleges módosítása | 200         |
| DELETE  | /api/:id       | Adott ID-jű misszió törlése              | 200         |

Hibakódok: `400` (érvénytelen ID / adat), `404` (nincs ilyen elem), `500` (szerverhiba).

## Teszt-felosztás (végpontonként külön fájl)

| Fájl                  | Végpont        | Tesztek száma |
|-----------------------|----------------|---------------|
| tests/post.test.js    | POST /api      | 8 |
| tests/getAll.test.js  | GET /api       | 8 |
| tests/getById.test.js | GET /api/:id   | 9 |
| tests/patch.test.js   | PATCH /api/:id | 9 |
| tests/delete.test.js  | DELETE /api/:id| 9 |

## Példa kérés

```bash
curl -X POST http://localhost:3000/api -H "Content-Type: application/json" \
  -d '{"name":"Artemis III","destination":"Hold","crewSize":4,"launchDate":"2027-09-01"}'
```
