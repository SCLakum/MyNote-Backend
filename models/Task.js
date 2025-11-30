const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
    dueDate: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: {
        type: String,
        enum: ['Todo', 'In Progress', 'Done'],
        default: 'Todo'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    dueDate: { type: Date },
    tags: [{ type: String }],
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    order: { type: Number, default: 0 },
    subtasks: [SubtaskSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update 'updatedAt' on save
TaskSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Task', TaskSchema);
