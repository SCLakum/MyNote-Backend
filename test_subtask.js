const taskId = '692c08c2700d0009e169f235';
const parentId = '692c08cd700d0009e169f244';

fetch(`http://localhost:5000/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: "Node Test Subtask Nested 2",
        parentId: parentId
    })
}).then(res => res.json()).then(data => {
    const parent = data.subtasks.find(s => s._id === parentId);
    console.log(JSON.stringify(parent, null, 2));
}).catch(console.error);
