import mongoose from 'mongoose';

const missingReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // link to the reporter
    reporterName: { type: String, required: true },
    reporterPhone: { type: String, required: true },
    reporterRelation: { type: String },

    personName: { type: String, required: true },
    personAge: { type: Number, required: true },
    personGender: { type: String, required: true },
    personHeight: { type: String },
    personClothing: { type: String },
    description: { type: String },

    lastSeenLocation: { type: String, required: true },
    lastSeenTime: { type: Date, required: true },

    photos: [{ type: String }] // store paths to uploaded photos
    // photos: req.files.map(file => file.filename) // ✅ stores just filename

  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

const MissingReport = mongoose.model('MissingReport', missingReportSchema);

export default MissingReport;
