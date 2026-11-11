// POST /api – új misszió felvitele (createMission)
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { createMission } = require('../controller/controller');
const { mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

describe('POST /api – createMission', () => {
    const body = {
        name: 'Artemis III',
        destination: 'Hold',
        crewSize: 4,
        launchDate: '2027-09-01'
    };

    test('sikeres létrehozásnál 201-es státuszt ad vissza', async () => {
        MissionModel.create.mockResolvedValue(sampleMission());
        const res = mockResponse();

        await createMission(mockRequest({ body }), res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('a létrehozott dokumentumot JSON-ben visszaadja', async () => {
        const created = sampleMission();
        MissionModel.create.mockResolvedValue(created);
        const res = mockResponse();

        await createMission(mockRequest({ body }), res);

        expect(res.json).toHaveBeenCalledWith(created);
    });

    test('a request body-t változtatás nélkül átadja a modellnek', async () => {
        MissionModel.create.mockResolvedValue(sampleMission());

        await createMission(mockRequest({ body }), mockResponse());

        expect(MissionModel.create).toHaveBeenCalledTimes(1);
        expect(MissionModel.create).toHaveBeenCalledWith(body);
    });

    test('hiányzó kötelező mező (ValidationError) esetén 400-at ad', async () => {
        MissionModel.create.mockRejectedValue(
            mongooseError('ValidationError', 'Mission validation failed: name: Path `name` is required.')
        );
        const res = mockResponse();

        await createMission(mockRequest({ body: { destination: 'Mars' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('érvénytelen státusz (enum hiba) esetén 400-at ad a hibaüzenettel', async () => {
        const message = '`landed` is not a valid enum value for path `status`.';
        MissionModel.create.mockRejectedValue(mongooseError('ValidationError', message));
        const res = mockResponse();

        await createMission(mockRequest({ body: { ...body, status: 'landed' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message });
    });

    test('negatív létszám (min validáció) esetén 400-at ad', async () => {
        MissionModel.create.mockRejectedValue(
            mongooseError('ValidationError', 'Path `crewSize` (-1) is less than minimum allowed value (0).')
        );
        const res = mockResponse();

        await createMission(mockRequest({ body: { ...body, crewSize: -1 } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('nem várt (adatbázis) hiba esetén 500-at ad', async () => {
        MissionModel.create.mockRejectedValue(new Error('connection lost'));
        const res = mockResponse();

        await createMission(mockRequest({ body }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'connection lost' });
    });

    test('hiba esetén nem hív find/update/delete műveletet', async () => {
        MissionModel.create.mockRejectedValue(new Error('boom'));

        await createMission(mockRequest({ body }), mockResponse());

        expect(MissionModel.find).not.toHaveBeenCalled();
        expect(MissionModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(MissionModel.findByIdAndDelete).not.toHaveBeenCalled();
    });
});
