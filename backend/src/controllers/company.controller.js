import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import Company from '../models/Company.js';
import Lead from '../models/Lead.js';

// POST /api/companies
export const createCompany = asyncHandler(async (req, res) => {
  const { name, industry, website, location } = req.body;
  const company = await Company.create({ name, industry, website, location });

  res.status(201).json({ success: true, data: company });
});

// GET /api/companies
export const listCompanies = asyncHandler(async (_req, res) => {
  const companies = await Company.find().sort('name').collation({ locale: 'en', strength: 2 }).lean();

  res.json({ success: true, data: companies });
});

// GET /api/companies/:id  (company details + associated, non-deleted leads)
export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id).lean();
  if (!company) throw new ApiError(404, 'Company not found');

  const leads = await Lead.find({ company: company._id, isDeleted: false })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name email')
    .lean();

  res.json({ success: true, data: { ...company, leads } });
});
