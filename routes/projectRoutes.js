const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET all projects
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST create project
router.post('/', async (req, res) => {
    const project = new Project({
        name: req.body.name,
        description: req.body.description,
        color: req.body.color
    });

    try {
        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update project
router.put('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (req.body.name) project.name = req.body.name;
        if (req.body.description !== undefined) project.description = req.body.description;
        if (req.body.color) project.color = req.body.color;

        const updatedProject = await project.save();
        res.json(updatedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE project
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Optional: Remove project reference from tasks or delete tasks?
        // For now, let's just nullify the project reference in tasks
        await Task.updateMany({ project: req.params.id }, { $set: { project: null } });

        await project.deleteOne();
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
