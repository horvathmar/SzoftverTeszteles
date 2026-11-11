// Közös segédeszközök a unit tesztekhez (külső függés nélkül)

const VALID_ID = '507f1f77bcf86cd799439011';

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockRequest = ({ params = {}, body = {}, query = {} } = {}) => ({ params, body, query });

const sampleMission = (overrides = {}) => ({
    _id: VALID_ID,
    name: 'Artemis III',
    destination: 'Hold',
    status: 'planned',
    crewSize: 4,
    launchDate: '2027-09-01T00:00:00.000Z',
    ...overrides
});

const mongooseError = (name, message) => {
    const error = new Error(message);
    error.name = name;
    return error;
};

module.exports = { VALID_ID, mockResponse, mockRequest, sampleMission, mongooseError };
