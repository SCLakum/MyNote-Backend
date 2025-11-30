const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { subDays, startOfDay, endOfDay, format } = require('date-fns');

// GET /api/analytics/summary
router.get('/summary', async (req, res) => {
    try {
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'Done' });
        const pendingTasks = await Task.countDocuments({ status: { $ne: 'Done' } });
        const overdueTasks = await Task.countDocuments({
            dueDate: { $lt: new Date() },
            status: { $ne: 'Done' }
        });

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/analytics/priority
router.get('/priority', async (req, res) => {
    try {
        const priorityDistribution = await Task.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format for frontend: { name: 'High', value: 10 }
        const formattedData = priorityDistribution.map(item => ({
            name: item._id,
            value: item.count
        }));

        res.json(formattedData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/analytics/daily-completion (Last 7 Days)
router.get('/daily-completion', async (req, res) => {
    try {
        const sevenDaysAgo = subDays(new Date(), 7);

        const dailyCompletion = await Task.aggregate([
            {
                $match: {
                    status: 'Done',
                    updatedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days with 0
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dateString = format(date, 'yyyy-MM-dd');
            const dayData = dailyCompletion.find(d => d._id === dateString);

            result.push({
                date: format(date, 'MMM dd'),
                count: dayData ? dayData.count : 0
            });
        }

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
