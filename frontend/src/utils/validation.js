export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

export const validateLead = (form) => {
  const errors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const phone = form.phone.trim();

  if (!name) errors.name = 'Name is required';
  else if (name.length > 100) errors.name = 'Name must be at most 100 characters';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address';

  if (!phone) errors.phone = 'Phone is required';
  else if (!PHONE_REGEX.test(phone)) errors.phone = 'Enter a valid phone number (7-20 digits, may include + - ( ) spaces)';

  return errors;
};

export const validateCompany = (form) => {
  const errors = {};
  const name = form.name.trim();
  const website = form.website.trim();

  if (!name) errors.name = 'Company name is required';
  else if (name.length > 120) errors.name = 'Company name must be at most 120 characters';

  if (form.industry.trim().length > 80) errors.industry = 'Industry must be at most 80 characters';
  if (form.location.trim().length > 120) errors.location = 'Location must be at most 120 characters';
  if (website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i.test(website)) {
    errors.website = 'Enter a valid website URL';
  }

  return errors;
};

export const validateTask = (form) => {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  else if (form.title.trim().length > 150) errors.title = 'Title must be at most 150 characters';
  if (!form.lead) errors.lead = 'Select a lead';
  if (!form.assignedTo) errors.assignedTo = 'Select an assignee';
  if (!form.dueDate) errors.dueDate = 'Due date is required';
  return errors;
};
