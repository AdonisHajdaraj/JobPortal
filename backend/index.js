// backend/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB u lidh me sukses'))
  .catch((err) => console.error('❌ Gabim me databazën:', err));

const User = mongoose.model('User', new mongoose.Schema({
  emri: String,
  email: String,
  fjalekalimi: String,
  role: { type: String, default: 'user' }, // default: user
}));

app.post('/register', async (req, res) => {
  const { emri, email, fjalekalimi, role } = req.body;
  try {
    const ekziston = await User.findOne({ email });
    if (ekziston) {
      return res.status(400).json({ message: 'Emaili ekziston' });
    }

    const user = new User({ emri, email, fjalekalimi, role });
    await user.save();
    res.status(201).json({ message: 'Përdoruesi u regjistrua me sukses' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim në server', error: err });
  }
});

app.post('/login', async (req, res) => {
  const { email, fjalekalimi } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Email nuk ekziston' });

    if (user.fjalekalimi !== fjalekalimi) {
      return res.status(401).json({ message: 'Fjalëkalim i gabuar' });
    }

    res.json({
      message: 'Kyçja me sukses',
      user: {
        emri: user.emri,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Gabim në server', error: err });
  }
});

// GET all users
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// POST add user
app.post('/users', async (req, res) => {
  const { emri, email, fjalekalimi, role } = req.body;
  const user = new User({ emri, email, fjalekalimi, role });
  await user.save();
  res.status(201).json({ message: 'U shtua me sukses' });
});

// PUT update user
app.put('/users/:id', async (req, res) => {
  const { emri, email, fjalekalimi, role } = req.body;
  await User.findByIdAndUpdate(req.params.id, { emri, email, fjalekalimi, role });
  res.json({ message: 'U përditësua' });
});

// DELETE user
app.delete('/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'U fshi me sukses' });
});
// Model Job
const jobSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
});

const Job = mongoose.model("Job", jobSchema);

// CRUD Routes

// GET all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create job
app.post("/api/jobs", async (req, res) => {
  const { title, description, status } = req.body;
  try {
    const newJob = new Job({ title, description, status });
    await newJob.save();
    res.status(201).json(newJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update job by id
app.put("/api/jobs/:id", async (req, res) => {
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedJob) return res.status(404).json({ message: "Job not found" });
    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE job by id
app.delete("/api/jobs/:id", async (req, res) => {
  try {
    const deletedJob = await Job.findByIdAndDelete(req.params.id);
    if (!deletedJob) return res.status(404).json({ message: "Job not found" });
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Contact Schema & Model
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

// POST /api/contact - save contact form data
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newContact = new Contact({ name, email, message });
    await newContact.save();
    res.status(201).json({ message: "Contact saved successfully" });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/contact - merr të gjitha mesazhet
app.get("/api/contact", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 }); // mesazhet më të reja në krye
    res.json(messages);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res.status(500).json({ error: "Server error" });
  }
});

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  createdAt: { type: Date, default: Date.now },
});

const Application = mongoose.model("Application", applicationSchema);

// Routes

// POST - krijo aplikim të ri
app.post("/api/applications", async (req, res) => {
  const { name, email, message, jobId } = req.body;

  if (!name || !email || !message || !jobId) {
    return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme." });
  }

  try {
    const application = new Application({ name, email, message, jobId });
    await application.save();
    res.status(201).json({ message: "Aplikimi u dërgua me sukses." });
  } catch (error) {
    console.error("Gabim:", error);
    res.status(500).json({ error: "Gabim i serverit." });
  }
});

// GET - merr të gjitha aplikimet
app.get("/api/applications", async (req, res) => {
  try {
    const applications = await Application.find().populate("jobId");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: "Gabim në server." });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveri u nis në portin ${PORT}`));
