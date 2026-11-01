import mongoose from 'mongoose';
import { LEAD_STATUSES } from '../constants.js';

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true },
    phone: { type: String, required: [true, 'Phone is required'], trim: true },
    status: { type: String, enum: LEAD_STATUSES, default: 'New' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    // Soft delete flag: records are never physically removed.
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

leadSchema.index({ isDeleted: 1, status: 1, createdAt: -1 });
leadSchema.index({ company: 1, isDeleted: 1 });

/**
 * Safety net: every normal query automatically excludes soft-deleted leads.
 * Controllers also add `isDeleted: false` explicitly. Pass `{ includeDeleted: true }`
 * as a query option to bypass (used only by the seed script).
 * Aggregations bypass query middleware, so they filter isDeleted explicitly.
 */
function excludeDeleted() {
  if (this.getOptions().includeDeleted) return;
  this.where({ isDeleted: false });
}

leadSchema.pre(
  ['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'countDocuments', 'updateOne', 'updateMany'],
  excludeDeleted
);

export default mongoose.model('Lead', leadSchema);
