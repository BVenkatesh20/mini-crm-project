import mongoose from 'mongoose';
import { TASK_STATUSES } from '../constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 150 },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: [true, 'Lead is required'] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Assignee is required'] },
    dueDate: { type: Date, required: [true, 'Due date is required'] },
    status: { type: String, enum: TASK_STATUSES, default: 'Pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ lead: 1 });

export default mongoose.model('Task', taskSchema);
