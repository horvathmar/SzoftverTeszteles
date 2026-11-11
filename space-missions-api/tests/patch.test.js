// PATCH /api/:id – adott azonosítójú misszió részleges módosítása (updateMission)
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { updateMission } = require('../controller/controller');
const { VALID_ID, mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

describe('PATCH /api/:id – updateMission', () => {
    const body = { status: 'launched' };

    test('sikeres módosításnál 200-as státuszt ad vissza', async () => {
        MissionModel.findByIdAndUpdate.mockResolvedValue(sampleMission({ status: 'launched' }));
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('a módosított dokumentumot visszaadja', async () => {
        const updated = sampleMission({ status: 'launched' });
        MissionModel.findByIdAndUpdate.mockResolvedValue(updated);
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        expect(res.json).toHaveBeenCalledWith(updated);
    });

    test('az azonosítóval, a body-val és a helyes opciókkal hívja a modellt', async () => {
        MissionModel.findByIdAndUpdate.mockResolvedValue(sampleMission());

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), mockResponse());

        expect(MissionModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(MissionModel.findByIdAndUpdate).toHaveBeenCalledWith(
            VALID_ID,
            body,
            { returnDocument: 'after', runValidators: true }
        );
    });

    test('nem létező azonosítónál 404-et ad', async () => {
        MissionModel.findByIdAndUpdate.mockResolvedValue(null);
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('érvénytelen formátumú azonosítónál 400-at ad, és nem hívja a modellt', async () => {
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: 'rossz-id' }, body }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(MissionModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('üres body esetén 400-at ad, és nem hívja a modellt', async () => {
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body: {} }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(MissionModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('hiányzó (undefined) body esetén 400-at ad', async () => {
        const res = mockResponse();
        const req = { params: { id: VALID_ID }, body: undefined, query: {} };

        await updateMission(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('validációs hiba (pl. rossz státusz) esetén 400-at ad a hibaüzenettel', async () => {
        const message = '`landed` is not a valid enum value for path `status`.';
        MissionModel.findByIdAndUpdate.mockRejectedValue(mongooseError('ValidationError', message));
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body: { status: 'landed' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message });
    });

    test('adatbázis hiba esetén 500-at ad', async () => {
        MissionModel.findByIdAndUpdate.mockRejectedValue(new Error('db error'));
        const res = mockResponse();

        await updateMission(mockRequest({ params: { id: VALID_ID }, body }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'db error' });
    });
});
