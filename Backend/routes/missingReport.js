import express from 'express';
import MissingReport from '../models/MissingReport.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, path.join(__dirname, '../uploads'));
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });
// const upload = multer({ storage });



// Save files in the 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + file.originalname;
    cb(null, uniqueSuffix); // store only filename, not full path
  }
});

const upload = multer({ storage });


// Create a new missing report
// router.post('/', upload.array('photos', 5), async (req, res) => {
//   try {
//     const { reporterName, reporterPhone, reporterRelation, personName, personAge, personGender, personHeight, personClothing, lastSeenLocation, lastSeenTime, description } = req.body;
    
//     const photos = req.files ? req.files.map(file => file.filename) : [];

//     // assume req.userId comes from authentication middleware
//     const newReport = new MissingReport({
//       reporterName,
//       reporterPhone,
//       reporterRelation,
//       personName,
//       personAge,
//       personGender,
//       personHeight,
//       personClothing,
//       lastSeenLocation,
//       lastSeenTime,
//       description,
//       photos,
//       user: req.userId // 🔹 link to logged-in user
//     });

//     await newReport.save();
//     res.status(201).json({ message: 'Missing report submitted successfully!', report: newReport });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


import authMiddleware from '../middleware/auth.js';  // <-- protect route

// Submit Missing Report
router.post('/', authMiddleware, upload.array('photos', 5), async (req, res) => {
  try {
    const reportData = req.body;

    if (req.files) {
      reportData.photos = req.files.map(file => file.filename);
    }

    // Attach logged-in user (from auth middleware)
    reportData.user = req.user.id;

    const report = new MissingReport(reportData);
    await report.save();

    res.json({ message: 'Report submitted', report });
  } catch (err) {
    console.error("Error submitting report:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});


// Get all missing reports
router.get('/', async (req, res) => {
  try {
    const reports = await MissingReport.find().populate('user', 'fullName email');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
