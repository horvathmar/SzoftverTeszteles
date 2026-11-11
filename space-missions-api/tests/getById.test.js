// GET /api/:id – adott azonosítójú misszió lekérése (getMissionById)
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { getMissionById } = require('../controller/controller');
const { VALID_ID, mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

describe('GET /api/:id – getMissionById', () => {
    test('létező azonosítónál 200-as státuszt ad vissza', async () => {
        MissionModel.findById.mockResolvedValue(sampleMission());
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('a megtalált missziót JSON-ben visszaadja', async () => {
        const mission = sampleMission();
        MissionModel.findById.mockResolvedValue(mission);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.json).toHaveBeenCalledWith(mission);
    });

    test('a kapott azonosítóval hívja a findById-t', async () => {
        MissionModel.findById.mockResolvedValue(sampleMission());

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), mockResponse());

        expect(MissionModel.findById).toHaveBeenCalledTimes(1);
        expect(MissionModel.findById).toHaveBeenCalledWith(VALID_ID);
    });

    test('nem létező azonosítónál 404-et ad', async () => {
        MissionModel.findById.mockResolvedValue(null);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('404 esetén a hibaüzenet tartalmazza az azonosítót', async () => {
        MissionModel.findById.mockResolvedValue(null);
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        const payload = res.json.mock.calls[0][0];
        expect(payload.message).toContain(VALID_ID);
    });

    test('érvénytelen formátumú azonosítónál 400-at ad', async () => {
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: 'nem-objectid' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('érvénytelen azonosítónál nem fordul az adatbázishoz', async () => {
        await getMissionById(mockRequest({ params: { id: '123' } }), mockResponse());

        expect(MissionModel.findById).not.toHaveBeenCalled();
    });

    test('CastError esetén 400-at ad', async () => {
        MissionModel.findById.mockRejectedValue(mongooseError('CastError', 'Cast to ObjectId failed'));
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('adatbázis hiba esetén 500-at ad', async () => {
        MissionModel.findById.mockRejectedValue(new Error('timeout'));
        const res = mockResponse();

        await getMissionById(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'timeout' });
    });
});
