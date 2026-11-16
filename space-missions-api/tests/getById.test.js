// =====================================================================
// GET /api/:id – adott azonosítójú misszió lekérése (getMissionById) – UNIT TESZTEK
// =====================================================================
// Mit tesztelünk? A controller getMissionById függvényét az Express-től és a MongoDB-től függetlenül.
// A teszt a függvény MINDEN lehetséges ágát lefedi:
//   200 (siker), 404 (nincs ilyen), 400 (rossz ID formátum / CastError), 500 (szerverhiba).
//
// Módszer: a Mongoose modellt mockoljuk (hamis findById), és a hamis req/res objektumokkal
// közvetlenül meghívjuk a függvényt. A teszt AAA (Arrange – Act – Assert) felépítésű.

// A valódi modell helyett egy hamis objektumot használunk, minden metódusa jest.fn() kémfüggvény.
// Ezt a controller betöltése előtt kell megcsinálni (a jest a jest.mock hívásokat automatikusan
// a fájl tetejére emeli, de a logikus sorrend így is ez).
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { getMissionById } = require('../controller/controller');
// VALID_ID = érvényes formátumú ID; mongooseError = hamis Mongoose hibát gyártó segéd.
const { VALID_ID, mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

describe('GET /api/:id – getMissionById', () => {

    // ---------------- 1. Siker: 200-as státusz ----------------
    test('létező azonosítónál 200-as státuszt ad vissza', async () => {
        // Arrange: a hamis findById megtalálja a missziót (visszaad egy objektumot).
        MissionModel.findById.mockResolvedValue(sampleMission());
        const res = mockResponse();

        // Act: az :id a req.params-ban érkezik, ahogy az Express-ben is.
        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        // Assert 
        //
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ---------------- 2. Siker: a törzs tartalma ----------------
    test('a megtalált missziót JSON-ben visszaadja', async () => {
        const mission = sampleMission();
        MissionModel.findById.mockResolvedValue(mission);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        // Pontosan azt a missziót kell visszaküldeni, amit a modell talált.
        expect(res.json).toHaveBeenCalledWith(mission);
    });

    // ---------------- 3. A modell helyes paraméterrel hívódik ----------------
    test('a kapott azonosítóval hívja a findById-t', async () => {
        MissionModel.findById.mockResolvedValue(sampleMission());

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), mockResponse());

        // Pontosan egyszer, és pontosan a kapott ID-val kell lekérdezni
        // (így biztos, hogy nem egy másik misszióra keres a kód).
        expect(MissionModel.findById).toHaveBeenCalledTimes(1);
        expect(MissionModel.findById).toHaveBeenCalledWith(VALID_ID);
    });

    // ---------------- 4. Nem létező misszió: 404 ----------------
    test('nem létező azonosítónál 404-et ad', async () => {
        // A Mongoose findById-ja null-t ad, ha nincs találat (ezt utánozzuk).
        MissionModel.findById.mockResolvedValue(null);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        // Az ID formátuma jó, de nincs ilyen elem -> 404 Not Found.
        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ---------------- 5. A 404 üzenet tartalmazza az ID-t ----------------
    test('404 esetén a hibaüzenet tartalmazza az azonosítót', async () => {
        MissionModel.findById.mockResolvedValue(null);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        // res.json.mock.calls[0][0] = a json() első hívásának első paramétere, vagyis a válasz törzse.
        // A toContain azt nézi, hogy az üzenet szövege tartalmazza-e az ID-t.
        const payload = res.json.mock.calls[0][0];
        expect(payload.message).toContain(VALID_ID);
    });

    // ---------------- 6. Rossz formátumú ID: 400 ----------------
    test('érvénytelen formátumú azonosítónál 400-at ad', async () => {
        const res = mockResponse();

        // 'nem-objectid' nem 24 hexa karakter, ezért az isValidId false-t ad.
        await getMissionById(mockRequest({ params: { id: 'nem-objectid' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ---------------- 7. Rossz ID: nincs DB hívás ----------------
    test('érvénytelen azonosítónál nem fordul az adatbázishoz', async () => {
        // A '123' túl rövid -> a validáció még az adatbázis előtt megállítja a kérést.
        await getMissionById(mockRequest({ params: { id: '123' } }), mockResponse());

        // Bizonyítja, hogy a validáció megelőzi a lekérdezést (spórolunk az adatbázis-hívással).
        expect(MissionModel.findById).not.toHaveBeenCalled();
    });

    // ---------------- 8. CastError: 400 ----------------
    test('CastError esetén 400-at ad', async () => {
        // Biztonsági háló: ha a formátum-ellenőrzésen átjutna egy ID, de a Mongoose mégis
        // CastError-t dobna, a handleError akkor is 400-at adjon (ne 500-at).
        MissionModel.findById.mockRejectedValue(mongooseError('CastError', 'Cast to ObjectId failed'));
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ---------------- 9. Általános hiba: 500 ----------------
    test('adatbázis hiba esetén 500-at ad', async () => {
        // Egy "sima" hiba (nem Mongoose validációs) -> szerveroldali hiba, 500.
        MissionModel.findById.mockRejectedValue(new Error('timeout'));
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'timeout' });
    });
});
