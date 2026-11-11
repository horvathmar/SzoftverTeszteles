const mongoose = require('mongoose');

// Űrmisszió: egy küldetés adatai
const MissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['planned', 'launched', 'completed', 'failed'],
        default: 'planned'
    },
    crewSize: {
        type: Number,
        required: true,
        min: 0
    },
    launchDate: {
        type: Date
    }
});

const MissionModel = mongoose.model('Mission', MissionSchema);
module.exports = MissionModel;
