// POST /api – új misszió felvitele (createMission)

// A model modult helyettesítjük egy mock (ál)modellel,
// így a tesztek során nem kell valódi adatbázishoz csatlakozni.
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

// Betöltjük a mock modellt és a tesztelendő createMission függvényt.
const MissionModel = require('../model/model');
const { createMission } = require('../controller/controller');

// Betöltjük a tesztekhez szükséges segédfüggvényeket és mintaadatokat.
const { mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

// A POST /api végpont tesztjeinek csoportja.
describe('POST /api – createMission', () => {

    // Ez az adat egy érvényes, új misszió létrehozásához szükséges.
    const body = {
        name: 'Artemis III',
        destination: 'Hold',
        crewSize: 4,
        launchDate: '2027-09-01'
    };

    // SIKERES LÉTREHOZÁS
    // Ellenőrizzük, hogy sikeres létrehozás esetén 201-es státuszkódot kapunk.
    test('sikeres létrehozásnál 201-es státuszt ad vissza', async () => {

        // Beállítjuk, hogy a modell egy létrehozott missziót adjon vissza.
        MissionModel.create.mockResolvedValue(sampleMission());

        // Létrehozunk egy mock választ.
        const res = mockResponse();

        // Meghívjuk a createMission függvényt a minta adatokkal.
        await createMission(mockRequest({ body }), res);

        // Ellenőrizzük, hogy a válasz státusza 201 (Created) lett.
        expect(res.status).toHaveBeenCalledWith(201);
    });

    // VISSZATÉRÉSI ÉRTÉK
    // Ellenőrizzük, hogy a létrehozott missziót küldi vissza a szerver.
    test('a létrehozott dokumentumot JSON-ben visszaadja', async () => {

        // Létrehozunk egy minta missziót, amit a modell "elment".
        const created = sampleMission();

        // Beállítjuk a modell visszatérési értékét.
        MissionModel.create.mockResolvedValue(created);

        const res = mockResponse();

        await createMission(mockRequest({ body }), res);

        // Ellenőrizzük, hogy a válaszban pontosan a létrehozott dokumentum szerepel.
        expect(res.json).toHaveBeenCalledWith(created);
    });

    // MODELL MEGHÍVÁSA
    // Ellenőrizzük, hogy a modell a kapott adatokkal fut le.
    test('a request body-t változtatás nélkül átadja a modellnek', async () => {

        MissionModel.create.mockResolvedValue(sampleMission());

        await createMission(mockRequest({ body }), mockResponse());

        // Ellenőrizzük, hogy pontosan egyszer hívta meg a modellt.
        expect(MissionModel.create).toHaveBeenCalledTimes(1);

        // Ellenőrizzük, hogy a body módosítás nélkül került átadásra.
        expect(MissionModel.create).toHaveBeenCalledWith(body);
    });

    // VALIDÁCIÓS HIBA
    // Hiányzó kötelező mező esetén a Mongoose validációs hibát dob,
    // amit a kontroller 400-as hibára fordít.
    test('hiányzó kötelező mező (ValidationError) esetén 400-at ad a hibaüzenettel', async () => {

        // A hibaüzenet, amit a Mongoose dobna a hiányzó "name" mezőre.
        const message = 'Mission validation failed: name: Path `name` is required.';

        // Beállítjuk, hogy a modell validációs hibát dobjon.
        MissionModel.create.mockRejectedValue(mongooseError('ValidationError', message));

        const res = mockResponse();

        // A "name" mezőt szándékosan kihagyjuk a body-ból.
        await createMission(mockRequest({ body: { destination: 'Mars' } }), res);

        // Ellenőrizzük a 400-as hibakódot.
        expect(res.status).toHaveBeenCalledWith(400);

        // Ellenőrizzük, hogy a megfelelő hibaüzenetet küldi vissza.
        expect(res.json).toHaveBeenCalledWith({ message });
    });

    // ÉRTÉKHATÁR HIBA
    // A crewSize mező minimuma 0, negatív érték esetén 400-as hibát várunk.
    test('negatív létszám (min validáció) esetén 400-at ad', async () => {

        // Beállítjuk, hogy a modell a min szabály megsértése miatt hibát dobjon.
        MissionModel.create.mockRejectedValue(
            mongooseError('ValidationError', 'Path `crewSize` (-1) is less than minimum allowed value (0).')
        );

        const res = mockResponse();

        // Szándékosan negatív létszámot adunk meg.
        await createMission(mockRequest({ body: { ...body, crewSize: -1 } }), res);

        // Ellenőrizzük a 400-as hibakódot.
        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ADATBÁZISHIBA
    // Ha az adatbázis hibát jelez (nem validációs), a szerver 500-as hibát ad vissza.
    test('nem várt (adatbázis) hiba esetén 500-at ad a hibaüzenettel', async () => {

        // Beállítjuk, hogy a modell egy általános hibát dobjon.
        MissionModel.create.mockRejectedValue(new Error('connection lost'));

        const res = mockResponse();

        await createMission(mockRequest({ body }), res);

        // Ellenőrizzük a szerverhibát jelző 500-as státuszkódot.
        expect(res.status).toHaveBeenCalledWith(500);

        // Ellenőrizzük, hogy a hibaüzenet is visszakerül a válaszba.
        expect(res.json).toHaveBeenCalledWith({ message: 'connection lost' });
    });
});
