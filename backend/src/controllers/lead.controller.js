import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { escapeRegex, getPagination, buildPaginationMeta } from '../utils/helpers.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

const POPULATE = [
  { path: 'assignedTo', select: 'name email' },
  { path: 'company', select: 'name' },
];

// Confirms referenced user/company exist so leads never point at missing documents.
const assertReferences = async ({ assignedTo, company }) => {
  if (assignedTo && !(await User.exists({ _id: assignedTo }))) {
    throw new ApiError(400, 'Assigned user does not exist');
  }
  if (company && !(await Company.exists({ _id: company }))) {
    throw new ApiError(400, 'Company does not exist');
  }
};

// Only these fields can be written by clients (blocks mass-assignment of isDeleted etc.).
const pickLeadFields = (body) => ({
  name: body.name,
  email: body.email,
  phone: body.phone,
  ...(body.status ? { status: body.status } : {}),
  assignedTo: body.assignedTo || null,
  company: body.company || null,
});

// POST /api/leads
export const createLead = asyncHandler(async (req, res) => {
  const data = pickLeadFields(req.body);
  await assertReferences(data);

  const lead = await Lead.create(data);
  await lead.populate(POPULATE);

  res.status(201).json({ success: true, data: lead });
});

// GET /api/leads?page=&limit=&search=&status=&assignedTo=&company=
export const listLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, status, assignedTo, company } = req.query;

  const filter = { isDeleted: false };
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (company) filter.company = company;
  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).populate(POPULATE).lean(),
    Lead.countDocuments(filter),
  ]);

  res.json({ success: true, data: leads, pagination: buildPaginationMeta({ page, limit, total }) });
});

// GET /api/leads/:id
export const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false }).populate(POPULATE);
  if (!lead) throw new ApiError(404, 'Lead not found');

  res.json({ success: true, data: lead });
});

// PUT /api/leads/:id
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, isDeleted: false });
  if (!lead) throw new ApiError(404, 'Lead not found');

  const data = pickLeadFields(req.body);
  await assertReferences(data);

  lead.set(data);
  await lead.save();
  await lead.populate(POPULATE);

  res.json({ success: true, data: lead });
});

// DELETE /api/leads/:id  (soft delete)
export const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { isDeleted: true },
    { new: true }
  );
  if (!lead) throw new ApiError(404, 'Lead not found');

  res.json({ success: true, message: 'Lead deleted' });
});
