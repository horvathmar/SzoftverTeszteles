// DELETE /api/:id – adott azonosítójú misszió törlése (deleteMission)

// A model modult helyettesítjük egy mock (ál)modellel,
// így a tesztek során nem kell valódi adatbázishoz csatlakozni.
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

// Betöltjük a mock modellt és a tesztelendő deleteMission függvényt.
const MissionModel = require('../model/model');
const { deleteMission } = require('../controller/controller');

// Betöltjük a tesztekhez szükséges segédfüggvényeket és mintaadatokat.
const { VALID_ID, mockRequest, mockResponse, sampleMission } = require('./helpers');

// A DELETE /api/:id végpont tesztjeinek csoportja.
describe('DELETE /api/:id – deleteMission', () => {

    // SIKERES TÖRLÉS
    // Ellenőrizzük, hogy sikeres törlés esetén 200-as státuszkódot kapunk.
    test('sikeres törlésnél 200-as státuszt ad vissza', async () => {

        // Beállítjuk, hogy a modell a törölt missziót adja vissza.
        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission());

        // Létrehozunk egy mock választ.
        const res = mockResponse();

        // Meghívjuk a deleteMission függvényt egy érvényes azonosítóval.
        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        // Ellenőrizzük, hogy a válasz státusza 200 lett.
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // VISSZATÉRÉSI ÜZENET
    // A válaszüzenetnek tartalmaznia kell a törölt misszió nevét.
    test('a visszaadott üzenet tartalmazza a törölt misszió nevét', async () => {

        // A modell egy "Voyager 3" nevű missziót ad vissza törölt dokumentumként.
        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission({ name: 'Voyager 3' }));

        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        // Kiolvassuk, hogy mit küldött vissza a res.json az első híváskor.
        const payload = res.json.mock.calls[0][0];

        // Ellenőrizzük, hogy az üzenetben szerepel a misszió neve.
        expect(payload.message).toContain('Voyager 3');
    });

    // MODELL MEGHÍVÁSA
    // Ellenőrizzük, hogy a modell a megfelelő azonosítóval fut le.
    test('a kapott azonosítóval hívja a findByIdAndDelete-et', async () => {

        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission());

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), mockResponse());

        // Ellenőrizzük, hogy pontosan egyszer hívta meg a modellt.
        expect(MissionModel.findByIdAndDelete).toHaveBeenCalledTimes(1);

        // Ellenőrizzük, hogy a törlendő misszió azonosítóját kapta paraméterként.
        expect(MissionModel.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    // NEM LÉTEZŐ AZONOSÍTÓ
    // Ha nincs ilyen misszió az adatbázisban, 404-es hibát adunk.
    test('nem létező azonosítónál 404-et ad', async () => {

        // A null azt jelenti, hogy nem található ilyen dokumentum.
        MissionModel.findByIdAndDelete.mockResolvedValue(null);

        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        // Ellenőrizzük a 404-es státuszkódot.
        expect(res.status).toHaveBeenCalledWith(404);
    });

    // HIBÁS AZONOSÍTÓ
    // Hibás formátumú ID esetén 400-as hibát kell visszaadni,
    // és az adatbázishoz egyáltalán nem szabad fordulni.
    test('érvénytelen formátumú azonosítónál 400-at ad, és nem hívja a modellt', async () => {

        const res = mockResponse();

        // Szándékosan hibás (nem 24 karakteres hexadecimális) azonosítót adunk meg.
        await deleteMission(mockRequest({ params: { id: 'xyz' } }), res);

        // Ellenőrizzük, hogy 400-as hibát kapunk.
        expect(res.status).toHaveBeenCalledWith(400);

        // Ellenőrizzük, hogy hibás ID esetén a modell nem futott le.
        expect(MissionModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    // ADATBÁZISHIBA
    // Ha az adatbázis hibát jelez, a szerver 500-as hibát ad vissza.
    test('adatbázis hiba esetén 500-at ad a hibaüzenettel', async () => {

        // Beállítjuk, hogy a modell egy általános hibát dobjon.
        MissionModel.findByIdAndDelete.mockRejectedValue(new Error('db error'));

        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        // Ellenőrizzük a szerverhibát jelző 500-as státuszkódot.
        expect(res.status).toHaveBeenCalledWith(500);

        // Ellenőrizzük, hogy a hibaüzenet is visszakerül a válaszba.
        expect(res.json).toHaveBeenCalledWith({ message: 'db error' });
    });
});
