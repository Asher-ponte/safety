const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 4000;

// In-memory data stores (replace with DB in production)
let users = [
  { id: 1, username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'administrator', name: 'Admin User' },
  { id: 2, username: 'employee', email: 'employee@example.com', password: 'emp123', role: 'employee', name: 'Employee User' }
];
let incidents = [];
let documents = {
  Procedure: [],
  Guidelines: [],
  Forms: []
};

app.use(cors());
app.use(bodyParser.json());

// User authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ ...user, password: undefined });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// User management
app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ ...u, password: undefined })));
});
app.post('/api/users', (req, res) => {
  const { username, email, password, role } = req.body;
  if (users.some(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const id = Date.now();
  const user = { id, username, email, password, role, name: username };
  users.push(user);
  res.json({ ...user, password: undefined });
});

// Incidents
app.get('/api/incidents', (req, res) => {
  res.json(incidents);
});
app.post('/api/incidents', (req, res) => {
  const incident = { ...req.body, id: Date.now() };
  incidents.unshift(incident);
  res.json(incident);
});
app.put('/api/incidents/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = incidents.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Incident not found' });
  incidents[idx] = { ...incidents[idx], ...req.body };
  res.json(incidents[idx]);
});
app.delete('/api/incidents/:id', (req, res) => {
  const id = parseInt(req.params.id);
  incidents = incidents.filter(i => i.id !== id);
  res.json({ success: true });
});

// Documents (file upload)
const upload = multer({ storage: multer.memoryStorage() });
app.get('/api/documents/:folder', (req, res) => {
  const folder = req.params.folder;
  res.json(documents[folder] || []);
});
app.post('/api/documents/:folder', upload.single('file'), (req, res) => {
  const folder = req.params.folder;
  if (!documents[folder]) documents[folder] = [];
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const doc = {
    id: Date.now(),
    name: file.originalname,
    data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
    uploadedAt: new Date().toISOString(),
    uploadedBy: req.body.uploadedBy || 'Unknown'
  };
  documents[folder].push(doc);
  res.json(doc);
});

app.listen(PORT, () => {
  console.log(`Safety Dashboard backend running on http://localhost:${PORT}`);
});