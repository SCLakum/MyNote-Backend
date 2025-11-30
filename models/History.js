const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    action: { type: String, required: true }, // e.g., "Status Updated", "Subtask Added"
    details: { type: String }, // e.g., "Changed from Todo to In Progress"
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);
