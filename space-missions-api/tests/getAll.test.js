// GET /api – összes misszió lekérése (getAllMissions)
jest.mock('../model/model', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
}));

const MissionModel = require('../model/model');
const { getAllMissions } = require('../controller/controller');
const { mockRequest, mockResponse, sampleMission } = require('./helpers');

describe('GET /api – getAllMissions', () => {
    test('sikeres lekérésnél 200-as státuszt ad vissza', async () => {
        MissionModel.find.mockResolvedValue([sampleMission()]);
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('a modelltől kapott listát változtatás nélkül visszaadja', async () => {
        const missions = [
            sampleMission(),
            sampleMission({ _id: '507f1f77bcf86cd799439012', name: 'Mars One', destination: 'Mars' })
        ];
        MissionModel.find.mockResolvedValue(missions);
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        expect(res.json).toHaveBeenCalledWith(missions);
    });

    test('üres adatbázisnál üres tömböt ad vissza', async () => {
        MissionModel.find.mockResolvedValue([]);
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    test('szűrő nélkül üres szűrőobjektummal hívja a find-ot', async () => {
        MissionModel.find.mockResolvedValue([]);

        await getAllMissions(mockRequest(), mockResponse());

        expect(MissionModel.find).toHaveBeenCalledTimes(1);
        expect(MissionModel.find).toHaveBeenCalledWith({});
    });

    test('érvényes ?status= paraméterrel szűrve hívja a find-ot', async () => {
        MissionModel.find.mockResolvedValue([sampleMission({ status: 'launched' })]);

        await getAllMissions(mockRequest({ query: { status: 'launched' } }), mockResponse());

        expect(MissionModel.find).toHaveBeenCalledWith({ status: 'launched' });
    });

    test('érvénytelen ?status= paraméternél 400-at ad', async () => {
        const res = mockResponse();

        await getAllMissions(mockRequest({ query: { status: 'landed' } }), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('érvénytelen státusznál nem fordul az adatbázishoz', async () => {
        await getAllMissions(mockRequest({ query: { status: 'xyz' } }), mockResponse());

        expect(MissionModel.find).not.toHaveBeenCalled();
    });

    test('adatbázis hiba esetén 500-at ad a hibaüzenettel', async () => {
        MissionModel.find.mockRejectedValue(new Error('db down'));
        const res = mockResponse();

        await getAllMissions(mockRequest(), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'db down' });
    });
});
