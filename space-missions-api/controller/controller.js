const MissionModel = require('../model/model');
const { isValidId } = require('../utils/validateId');

const ALLOWED_STATUSES = ['planned', 'launched', 'completed', 'failed'];

// Mongoose validációs hibák -> 400, minden más -> 500
const handleError = (res, error) => {
    if (error && (error.name === 'ValidationError' || error.name === 'CastError')) {
        return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: error.message });
};

// POST /api
const createMission = async (req, res) => {
    try {
        const data = await MissionModel.create(req.body);
        res.status(201).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// GET /api  (opcionális ?status= szűrés)
const getAllMissions = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};

        if (status !== undefined) {
            if (!ALLOWED_STATUSES.includes(status)) {
                return res.status(400).json({
                    message: `Érvénytelen státusz! Lehetséges értékek: ${ALLOWED_STATUSES.join(', ')}`
                });
            }
            filter = { status };
        }

        const data = await MissionModel.find(filter);
        res.status(200).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// GET /api/:id
const getMissionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Érvénytelen azonosító formátum!' });
        }

        const data = await MissionModel.findById(id);
        if (!data) {
            return res.status(404).json({ message: `${id} azonosítóval nem létezik misszió!` });
        }
        res.status(200).json(data);
    } catch (error) {
        handleError(res, error);
    }
};

// PATCH /api/:id
const updateMission = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Érvénytelen azonosító formátum!' });
        }
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: 'A módosításhoz legalább egy mezőt meg kell adni!' });
        }

        const options = { returnDocument: 'after', runValidators: true };
        const result = await MissionModel.findByIdAndUpdate(id, req.body, options);

        if (!result) {
            return res.status(404).json({ message: `${id} azonosítóval nem létezik misszió!` });
        }
        res.status(200).json(result);
    } catch (error) {
        handleError(res, error);
    }
};

// DELETE /api/:id
const deleteMission = async (req, res) => {
    try {
        const { id } = req.params;

        if (!isValidId(id)) {
            return res.status(400).json({ message: 'Érvénytelen azonosító formátum!' });
        }

        const data = await MissionModel.findByIdAndDelete(id);
        if (!data) {
            return res.status(404).json({ message: `${id} azonosítóval nem létezik misszió!` });
        }
        res.status(200).json({ message: `A(z) ${data.name} nevű misszió törölve lett.` });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports = {
    createMission,
    getAllMissions,
    getMissionById,
    updateMission,
    deleteMission
};
