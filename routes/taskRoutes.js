const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const History = require('../models/History');

// Helper to log history
const logHistory = async (taskId, action, details) => {
    try {
        await History.create({ taskId, action, details });
    } catch (err) {
        console.error('Failed to log history:', err);
    }
};

// GET all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find().populate('project').sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET single task
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');
        if (!task) return res.status(404).json({ message: 'Task not found' });
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create task
router.post('/', async (req, res) => {
    const task = new Task({
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        status: req.body.status,
        dueDate: req.body.dueDate,
        tags: req.body.tags,
        project: req.body.project || null
    });

    try {
        const newTask = await task.save();
        await logHistory(newTask._id, 'Task Created', `Task "${newTask.title}" created.`);
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update task
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const originalStatus = task.status;

        // Update fields
        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.status = req.body.status || task.status;
        if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
        if (req.body.tags !== undefined) task.tags = req.body.tags;
        if (req.body.project !== undefined) task.project = req.body.project || null;

        const updatedTask = await task.save();

        // Log status change
        if (originalStatus !== updatedTask.status) {
            await logHistory(updatedTask._id, 'Status Updated', `Status changed from ${originalStatus} to ${updatedTask.status}`);
        } else {
            await logHistory(updatedTask._id, 'Task Updated', 'Task details updated');
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        await task.deleteOne();
        // Optionally delete history or keep it for audit? 
        // For now, we'll leave history as orphaned records or we could delete them.
        // await History.deleteMany({ taskId: req.params.id }); 

        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- Subtasks ---

// POST add subtask
router.post('/:id/subtasks', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.subtasks.push({
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'Medium'
        });
        const updatedTask = await task.save();

        await logHistory(updatedTask._id, 'Subtask Added', `Subtask "${req.body.title}" added.`);
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update subtask (toggle or edit)
// PUT update subtask (toggle or edit)
router.put('/:id/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const subtask = task.subtasks.id(req.params.subtaskId);
        if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

        // If body contains isCompleted, set it
        if (req.body.isCompleted !== undefined) {
            subtask.isCompleted = req.body.isCompleted;
            await logHistory(task._id, 'Subtask Updated', `Subtask "${subtask.title}" marked as ${subtask.isCompleted ? 'Done' : 'Pending'}.`);
        }
        // If body has no update fields, assume toggle (legacy behavior support)
        else if (!req.body.title && !req.body.description && !req.body.priority) {
            subtask.isCompleted = !subtask.isCompleted;
            await logHistory(task._id, 'Subtask Updated', `Subtask "${subtask.title}" marked as ${subtask.isCompleted ? 'Done' : 'Pending'}.`);
        }

        // If body contains other fields, update them
        if (req.body.title) subtask.title = req.body.title;
        if (req.body.description) subtask.description = req.body.description;
        if (req.body.priority) subtask.priority = req.body.priority;

        const updatedTask = await task.save();

        // Log general update if not just toggling
        if (req.body.title || req.body.description || req.body.priority) {
            await logHistory(updatedTask._id, 'Subtask Edited', `Subtask "${subtask.title}" details updated.`);
        }

        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE subtask
router.delete('/:id/subtasks/:subtaskId', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.subtasks.pull(req.params.subtaskId);
        const updatedTask = await task.save();

        await logHistory(updatedTask._id, 'Subtask Deleted', 'Subtask removed.');
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- History ---

// GET history for a task
router.get('/:id/history', async (req, res) => {
    try {
        const history = await History.find({ taskId: req.params.id }).sort({ timestamp: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE history item
router.delete('/:id/history/:historyId', async (req, res) => {
    try {
        await History.findByIdAndDelete(req.params.historyId);
        res.json({ message: 'History item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE all history for a task
router.delete('/:id/history', async (req, res) => {
    try {
        await History.deleteMany({ taskId: req.params.id });
        res.json({ message: 'All history cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT reorder tasks
router.put('/reorder', async (req, res) => {
    try {
        const { tasks } = req.body;
        // tasks should be an array of objects with { _id, order }

        const bulkOps = tasks.map(task => ({
            updateOne: {
                filter: { _id: task._id },
                update: { $set: { order: task.order } }
            }
        }));

        await Task.bulkWrite(bulkOps);
        res.json({ message: 'Tasks reordered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
