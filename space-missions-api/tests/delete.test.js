// DELETE /api/:id – adott azonosítójú misszió törlése (deleteMission)
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { deleteMission } = require('../controller/controller');
const { VALID_ID, mockRequest, mockResponse, sampleMission, mongooseError } = require('./helpers');

describe('DELETE /api/:id – deleteMission', () => {
    test('sikeres törlésnél 200-as státuszt ad vissza', async () => {
        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission());
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('a visszaadott üzenet tartalmazza a törölt misszió nevét', async () => {
        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission({ name: 'Voyager 3' }));
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        const payload = res.json.mock.calls[0][0];
        expect(payload.message).toContain('Voyager 3');
    });

    test('a kapott azonosítóval hívja a findByIdAndDelete-et', async () => {
        MissionModel.findByIdAndDelete.mockResolvedValue(sampleMission());

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), mockResponse());

        expect(MissionModel.findByIdAndDelete).toHaveBeenCalledTimes(1);
        expect(MissionModel.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    });

    test('nem létező azonosítónál 404-et ad', async () => {
        MissionModel.findByIdAndDelete.mockResolvedValue(null);
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('404 esetén a hibaüzenet tartalmazza az azonosítót', async () => {
        MissionModel.findByIdAndDelete.mockResolvedValue(null);
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.json.mock.calls[0][0].message).toContain(VALID_ID);
    });

    test('érvénytelen formátumú azonosítónál 400-at ad', async () => {
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: 'xyz' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('érvénytelen azonosítónál nem fordul az adatbázishoz', async () => {
        await deleteMission(mockRequest({ params: { id: '' } }), mockResponse());

        expect(MissionModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    test('CastError esetén 400-at ad', async () => {
        MissionModel.findByIdAndDelete.mockRejectedValue(mongooseError('CastError', 'Cast failed'));
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('adatbázis hiba esetén 500-at ad', async () => {
        MissionModel.findByIdAndDelete.mockRejectedValue(new Error('db error'));
        const res = mockResponse();

        await deleteMission(mockRequest({ params: { id: VALID_ID } }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'db error' });
    });
});
