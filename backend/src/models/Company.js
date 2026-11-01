import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 120 },
    industry: { type: String, trim: true, maxlength: 80, default: '' },
    website: { type: String, trim: true, maxlength: 200, default: '' },
    location: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { timestamps: true }
);

companySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Company', companySchema);
