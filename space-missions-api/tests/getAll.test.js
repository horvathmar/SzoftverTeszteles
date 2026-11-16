// =====================================================================
// GET /api – összes misszió lekérése (getAllMissions) – UNIT TESZTEK
// =====================================================================
// Mit tesztelünk? A controller getAllMissions függvényét, KÜLÖN, az Express-től és
// az adatbázistól függetlenül. Ezért ez egy UNIT teszt: nem kell hozzá se szerver, se MongoDB.
//
// Hogyan? Mockolással: a valódi Mongoose modellt egy hamis változattal helyettesítjük,
// aminek a függvényeit (find, findById, ...) mi vezéreljük: megmondjuk, mit adjanak vissza.
// Így pontosan azt a kódot teszteljük, amit mi írtunk, nem a Mongoose-t vagy az adatbázist.
//
// A tesztek felépítése (AAA minta):
//   Arrange – előkészítés (mock beállítása, hamis res/req)
//   Act     – a tesztelt függvény meghívása
//   Assert  – az elvárt eredmény ellenőrzése (expect)

// jest.mock: lecseréli a '../model/model' modult erre a hamis objektumra, MIELŐTT a controller betöltődne.
// Minden metódus jest.fn() = "kémfüggvény", ami semmit sem csinál, de számon tartja a hívásokat.
// A getAll tesztben csak a `find` számít, de a többit is fel kell venni, mert a controller
// az összes függvényt betölti és a modellre hivatkozik.
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

// A (már hamis) modell és a tesztelt függvény betöltése.
const MissionModel = require('../model/model');
const { getAllMissions } = require('../controller/controller');
// Közös segédek a helpers.js-ből (hamis req/res, minta adat).
const { mockRequest, mockResponse, sampleMission } = require('./helpers');

// describe: egy csoportba fogja a hozzátartozó teszteket, a kimenetben is így jelenik meg.
describe('GET /api – getAllMissions', () => {

    // ---------------- 1. Sikeres lekérés: státuszkód ----------------
    test('sikeres lekérésnél 200-as státuszt ad vissza', async () => {
        // Arrange: a hamis find() egy 1 elemű listával "válaszol" (mockResolvedValue = sikeres Promise).
        MissionModel.find.mockResolvedValue([sampleMission()]);
        const res = mockResponse();

        // Act: meghívjuk a controllert egy üres (szűrő nélküli) kéréssel.
        await getAllMissions(mockRequest(), res);

        // Assert: a válasz státuszát 200-ra állították-e.
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ---------------- 2. A lista változatlanul visszajön ----------------
    test('a modelltől kapott listát változtatás nélkül visszaadja', async () => {
        // Két különböző missziót készítünk (az overrides-szal módosított mezőkkel).
        const missions = [
            sampleMission(),
            sampleMission({ _id: '507f1f77bcf86cd799439012', name: 'Mars One', destination: 'Mars' })
        ];
        MissionModel.find.mockResolvedValue(missions);
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        // Azt ellenőrizzük, hogy a controller pontosan azt küldi vissza JSON-ben, amit a modell adott
        // (nem módosít, nem szűr, nem rendez az adaton).
        expect(res.json).toHaveBeenCalledWith(missions);
    });

    // ---------------- 3. Üres adatbázis (határeset) ----------------
    test('üres adatbázisnál üres tömböt ad vissza', async () => {
        // Határeset: nincs egyetlen misszió sem. Ez NEM hiba, ezért 200 + [] az elvárt.
        MissionModel.find.mockResolvedValue([]);
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    // ---------------- 4. Szűrő nélkül: üres szűrőobjektum ----------------
    test('szűrő nélkül üres szűrőobjektummal hívja a find-ot', async () => {
        MissionModel.find.mockResolvedValue([]);

        await getAllMissions(mockRequest(), mockResponse());

        // toHaveBeenCalledTimes(1): pontosan egyszer fordult az adatbázishoz (nincs felesleges hívás).
        expect(MissionModel.find).toHaveBeenCalledTimes(1);
        // {} = "nincs feltétel" a MongoDB-ben, vagyis mindent lekér.
        expect(MissionModel.find).toHaveBeenCalledWith({});
    });

    // ---------------- 5. Érvényes státusz: szűrés ----------------
    test('érvényes ?status= paraméterrel szűrve hívja a find-ot', async () => {
        MissionModel.find.mockResolvedValue([sampleMission({ status: 'launched' })]);

        // A query objektum megfelel a ?status=launched URL-nek.
        await getAllMissions(mockRequest({ query: { status: 'launched' } }), mockResponse());

        // A find-ot a { status: 'launched' } szűrővel kellett meghívni.
        expect(MissionModel.find).toHaveBeenCalledWith({ status: 'launched' });
    });

    // ---------------- 6. Érvénytelen státusz: 400 ----------------
    test('érvénytelen ?status= paraméternél 400-at ad', async () => {
        const res = mockResponse();

        // A 'landed' nincs az engedélyezett értékek között.
        await getAllMissions(mockRequest({ query: { status: 'landed' } }), res);

        // Negatív teszt: hibás bemenetre 400 Bad Request az elvárt.
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ---------------- 7. Érvénytelen státusz: nincs DB hívás ----------------
    test('érvénytelen státusznál nem fordul az adatbázishoz', async () => {
        // Itt nem kell mockResolvedValue, mert a find-nak úgysem szabad lefutnia.
        await getAllMissions(mockRequest({ query: { status: 'xyz' } }), mockResponse());

        // not.toHaveBeenCalled: bizonyítja, hogy a validáció MEGELŐZI az adatbázis-lekérdezést.
        expect(MissionModel.find).not.toHaveBeenCalled();
    });

    // ---------------- 8. Adatbázis hiba: 500 ----------------
    test('adatbázis hiba esetén 500-at ad a hibaüzenettel', async () => {
        // mockRejectedValue: a hamis find() hibával (elutasított Promise-szal) tér vissza,
        // mintha leállt volna az adatbázis.
        MissionModel.find.mockRejectedValue(new Error('db down'));
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        // A catch ág -> handleError -> általános hiba, tehát 500, és az üzenetet is továbbadja.
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'db down' });
    });
});
