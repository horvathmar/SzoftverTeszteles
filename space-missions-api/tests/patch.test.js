// PATCH /api/:id – adott azonosítójú misszió részleges módosítása (updateMission)

// A model modult helyettesítjük egy mock (ál)modellel,
// így a tesztek során nem kell valódi adatbázishoz csatlakozni.
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

// Betöltjük a misszió modellt és a tesztelendő updateMission függvényt.
const MissionModel = require('../model/model');
const { updateMission } = require('../controller/controller');

// Betöltjük a tesztekhez szükséges segédfüggvényeket és mintaadatokat.
const {
    VALID_ID,
    mockRequest,
    mockResponse,
    sampleMission,
    mongooseError
} = require('./helpers');

// A PATCH /api/:id végpont tesztjeinek csoportja.
describe('PATCH /api/:id – updateMission', () => {

    // Ez az adat módosítja a misszió állapotát.
    const body = { status: 'launched' };

    // SIKERES MÓDOSÍTÁS
    // Ellenőrizzük, hogy sikeres módosítás esetén 200-as státuszkódot kapunk.
    test('sikeres módosításnál 200-as státuszt ad vissza', async () => {

        // Beállítjuk, hogy a modell egy módosított missziót adjon vissza.
        MissionModel.findByIdAndUpdate.mockResolvedValue(sampleMission({ status: 'launched' }));

        // Létrehozunk egy mock választ.
        const res = mockResponse();

        // Meghívjuk az updateMission függvényt a megfelelő azonosítóval és adatokkal.
        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        // Ellenőrizzük, hogy a válasz státusza 200 lett.
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // VISSZATÉRÉSI ÉRTÉK
    // Ellenőrizzük, hogy a módosított missziót küldi vissza a szerver.
    test('a módosított dokumentumot visszaadja', async () => {

        // Létrehozunk egy módosított minta missziót.
        const updated = sampleMission({ status: 'launched' });

        // Beállítjuk a modell visszatérési értékét.
        MissionModel.findByIdAndUpdate.mockResolvedValue(updated);

        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        // Ellenőrizzük, hogy a válaszban a módosított dokumentum szerepel.
        expect(res.json).toHaveBeenCalledWith(updated);
    });

    // MODELL MEGHÍVÁSA
    // Ellenőrizzük, hogy a modell a megfelelő paraméterekkel fut le.
    test('az azonosítóval, a body-val és a helyes opciókkal hívja a modellt', async () => {

        MissionModel.findByIdAndUpdate.mockResolvedValue(sampleMission());

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), mockResponse());

        // Ellenőrizzük, hogy pontosan egyszer hívta meg a modellt.
        expect(MissionModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);

        // Ellenőrizzük az átadott paramétereket:
        // 1. VALID_ID: a módosítandó misszió azonosítója.
        // 2. body: a módosítandó adatok.
        // 3. returnDocument: 'after': a módosítás utáni dokumentumot adja vissza.
        // 4. runValidators: true: bekapcsolja a validációt.
        expect(MissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
            VALID_ID,
            body,
            { returnDocument: 'after', runValidators: true }
        );
    });

    // NEM LÉTEZŐ AZONOSÍTÓ
    // Ha nincs ilyen misszió az adatbázisban, 404-es hibát adunk.
    test('nem létező azonosítónál 404-et ad', async () => {

        // A null azt jelenti, hogy nem található ilyen dokumentum.
        MissionModel.findByIdAndUpdate.mockResolvedValue(null);

        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        // Ellenőrizzük a 404-es státuszkódot.
        expect(res.status).toHaveBeenCalledWith(404);
    });

    // HIBÁS AZONOSÍTÓ
    // Hibás formátumú ID esetén 400-as hibát kell visszaadni.
    test('érvénytelen formátumú azonosítónál 400-at ad, és nem hívja a modellt', async () => {

        const res = mockResponse();

        // Szándékosan hibás azonosítót adunk meg.
        await updateMission(mockRequest({ params: { id: 'rossz-id' }, body }), res);

        // Ellenőrizzük, hogy 400-as hibát kapunk.
        expect(res.status).toHaveBeenCalledWith(400);

        // Ellenőrizzük, hogy hibás ID esetén a modell nem futott le.
        expect(MissionModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // ÜRES BODY
    // Üres módosítási adatok esetén 400-as hibát várunk.
    test('üres body esetén 400-at ad, és nem hívja a modellt', async () => {

        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body: {} }), res);

        // Ellenőrizzük a hibás kérés státuszkódját.
        expect(res.status).toHaveBeenCalledWith(400);

        // Üres adatokkal nem szabad meghívni az adatbázismodellt.
        expect(MissionModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // HIÁNYZÓ BODY
    // Ha egyáltalán nem érkezik módosítandó adat, 400-as hibát adunk.
    test('hiányzó (undefined) body esetén 400-at ad', async () => {

        const res = mockResponse();

        // Olyan kérést hozunk létre, amelynek body értéke undefined.
        const req = { params: { id: VALID_ID }, body: undefined, query: {} };

        await updateMission(req, res);

        // Ellenőrizzük a 400-as hibakódot.
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // VALIDÁCIÓS HIBA
    // Hibás mezőérték esetén a Mongoose validációs hibát dob.
    test('validációs hiba (pl. rossz státusz) esetén 400-at ad a hibaüzenettel', async () => {

        // A 'landed' nem megengedett érték a status mezőben.
        const message = '`landed` is not a valid enum value for path `status`.';

        // Beállítjuk, hogy a modell validációs hibát dobjon.
        MissionModel.findByIdAndUpdate.mockRejectedValue(mongooseError('ValidationError', message));

        const res = mockResponse();

        // Hibás státusszal hívjuk meg a függvényt.
        await updateMission(mockRequest({
            params: { id: VALID_ID },
            body: { status: 'landed' }
        }), res);

        // Ellenőrizzük a 400-as hibakódot.
        expect(res.status).toHaveBeenCalledWith(400);

        // Ellenőrizzük, hogy a megfelelő hibaüzenetet küldi vissza.
        expect(res.json).toHaveBeenCalledWith({ message });
    });

    // ADATBÁZISHIBA
    // Ha az adatbázis hibát jelez, a szerver 500-as hibát ad vissza.
    test('adatbázis hiba esetén 500-at ad', async () => {

        // Beállítjuk, hogy a modell egy általános hibát dobjon.
        MissionModel.findByIdAndUpdate.mockRejectedValue(new Error('db error'));

        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        // Ellenőrizzük a szerverhibát jelző 500-as státuszkódot.
        expect(res.status).toHaveBeenCalledWith(500);

        // Ellenőrizzük, hogy a hibaüzenet is visszakerül a válaszba.
        expect(res.json).toHaveBeenCalledWith({ message: 'db error' });
    });
});
