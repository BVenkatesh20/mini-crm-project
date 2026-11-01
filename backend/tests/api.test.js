import { before, after, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789';
process.env.MONGO_URI = 'mongodb://placeholder/overridden-below';

let mongod;
let app;
let User;
let Lead;
let Company;
let Task;

const PASSWORD = 'Passw0rd!';

const authed = (method, url, token) => request(app)[method](url).set('Authorization', `Bearer ${token}`);

const makeUser = (name, email) => User.create({ name, email, password: PASSWORD });

const loginAs = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200);
  return res.body.token;
};

const todayWindow = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end, noon: new Date(start.getTime() + 12 * 3600 * 1000) };
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('mini-crm-test');
  await mongoose.connect(process.env.MONGO_URI);

  app = (await import('../src/app.js')).default;
  User = (await import('../src/models/User.js')).default;
  Lead = (await import('../src/models/Lead.js')).default;
  Company = (await import('../src/models/Company.js')).default;
  Task = (await import('../src/models/Task.js')).default;
  await Promise.all([User.init(), Company.init()]);
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Company.deleteMany({}), Lead.deleteMany({}), Task.deleteMany({})]);
});

describe('authentication', () => {
  it('logs in with valid credentials and never returns the password', async () => {
    await makeUser('Demo', 'demo@test.com');
    const res = await request(app).post('/api/auth/login').send({ email: 'demo@test.com', password: PASSWORD });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'demo@test.com');
    assert.equal(res.body.user.password, undefined);
  });

  it('stores a bcrypt hash, not the plain password', async () => {
    await makeUser('Demo', 'demo@test.com');
    const user = await User.findOne({ email: 'demo@test.com' }).select('+password');
    assert.notEqual(user.password, PASSWORD);
    assert.match(user.password, /^\$2[aby]\$/);
  });

  it('rejects a wrong password and an unknown email with the same message', async () => {
    await makeUser('Demo', 'demo@test.com');
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'demo@test.com', password: 'nope-nope' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'who@test.com', password: PASSWORD });

    assert.equal(wrongPassword.status, 401);
    assert.equal(unknownEmail.status, 401);
    assert.equal(wrongPassword.body.message, unknownEmail.body.message);
  });

  it('validates the login payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
  });

  it('protects private routes', async () => {
    const noToken = await request(app).get('/api/leads');
    assert.equal(noToken.status, 401);

    const badToken = await request(app).get('/api/leads').set('Authorization', 'Bearer not.a.jwt');
    assert.equal(badToken.status, 401);

    await makeUser('Demo', 'demo@test.com');
    const token = await loginAs('demo@test.com');
    const ok = await authed('get', '/api/leads', token);
    assert.equal(ok.status, 200);
  });
});

describe('leads', () => {
  let token;
  let user;

  beforeEach(async () => {
    user = await makeUser('Demo', 'demo@test.com');
    token = await loginAs('demo@test.com');
  });

  const validLead = (overrides = {}) => ({
    name: 'Priya Raman',
    email: 'priya@example.com',
    phone: '+91 98400 11111',
    status: 'New',
    assignedTo: String(user._id),
    ...overrides,
  });

  it('creates, updates and lists leads', async () => {
    const created = await authed('post', '/api/leads', token).send(validLead());
    assert.equal(created.status, 201);
    assert.equal(created.body.data.isDeleted, false);

    const updated = await authed('put', `/api/leads/${created.body.data._id}`, token).send(validLead({ status: 'Qualified' }));
    assert.equal(updated.status, 200);
    assert.equal(updated.body.data.status, 'Qualified');

    const list = await authed('get', '/api/leads', token);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.pagination.total, 1);
  });

  it('rejects invalid input', async () => {
    const badStatus = await authed('post', '/api/leads', token).send(validLead({ status: 'Hot' }));
    assert.equal(badStatus.status, 400);

    const badEmail = await authed('post', '/api/leads', token).send(validLead({ email: 'nope' }));
    assert.equal(badEmail.status, 400);

    const badId = await authed('get', '/api/leads/not-an-id', token);
    assert.equal(badId.status, 400);
  });

  it('does not let clients set isDeleted through the API', async () => {
    const res = await authed('post', '/api/leads', token).send({ ...validLead(), isDeleted: true });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.isDeleted, false);
  });

  it('supports search, status filter and pagination', async () => {
    for (let i = 1; i <= 7; i += 1) {
      await Lead.create({
        name: `Lead ${i}`,
        email: `lead${i}@example.com`,
        phone: '1234567890',
        status: i <= 3 ? 'Qualified' : 'New',
      });
    }

    const page1 = await authed('get', '/api/leads?limit=5&page=1', token);
    assert.equal(page1.body.data.length, 5);
    assert.equal(page1.body.pagination.total, 7);
    assert.equal(page1.body.pagination.totalPages, 2);

    const page2 = await authed('get', '/api/leads?limit=5&page=2', token);
    assert.equal(page2.body.data.length, 2);

    const qualified = await authed('get', '/api/leads?status=Qualified', token);
    assert.equal(qualified.body.pagination.total, 3);

    const search = await authed('get', '/api/leads?search=lead5', token);
    assert.equal(search.body.pagination.total, 1);

    // regex characters in the search box must be treated literally, not crash
    const special = await authed('get', '/api/leads?search=' + encodeURIComponent('.*('), token);
    assert.equal(special.status, 200);
    assert.equal(special.body.pagination.total, 0);
  });

  it('soft deletes: the record stays in MongoDB but disappears from every normal query', async () => {
    const created = await authed('post', '/api/leads', token).send(validLead());
    const id = created.body.data._id;

    const del = await authed('delete', `/api/leads/${id}`, token);
    assert.equal(del.status, 200);

    const raw = await Lead.findOne({ _id: id }).setOptions({ includeDeleted: true });
    assert.ok(raw, 'document must still exist');
    assert.equal(raw.isDeleted, true);

    const list = await authed('get', '/api/leads', token);
    assert.equal(list.body.pagination.total, 0);

    assert.equal((await authed('get', `/api/leads/${id}`, token)).status, 404);
    assert.equal((await authed('put', `/api/leads/${id}`, token).send(validLead())).status, 404);
    assert.equal((await authed('delete', `/api/leads/${id}`, token)).status, 404);
  });
});

describe('companies', () => {
  let token;

  beforeEach(async () => {
    await makeUser('Demo', 'demo@test.com');
    token = await loginAs('demo@test.com');
  });

  it('creates and lists companies, rejecting duplicates', async () => {
    const created = await authed('post', '/api/companies', token).send({ name: 'Acme', industry: 'Manufacturing' });
    assert.equal(created.status, 201);

    const duplicate = await authed('post', '/api/companies', token).send({ name: 'ACME' });
    assert.equal(duplicate.status, 409);

    const missingName = await authed('post', '/api/companies', token).send({ name: '  ' });
    assert.equal(missingName.status, 400);

    const list = await authed('get', '/api/companies', token);
    assert.equal(list.body.data.length, 1);
  });

  it('shows company details with associated leads, excluding deleted ones', async () => {
    const company = await Company.create({ name: 'Globex' });
    await Lead.create({ name: 'Active', email: 'a@x.com', phone: '1234567', company: company._id });
    await Lead.create({ name: 'Removed', email: 'r@x.com', phone: '1234567', company: company._id, isDeleted: true });

    const res = await authed('get', `/api/companies/${company._id}`, token);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Globex');
    assert.deepEqual(res.body.data.leads.map((l) => l.name), ['Active']);

    const missing = await authed('get', `/api/companies/${new mongoose.Types.ObjectId()}`, token);
    assert.equal(missing.status, 404);
  });
});

describe('tasks and authorization', () => {
  let alice;
  let bob;
  let aliceToken;
  let bobToken;
  let lead;

  beforeEach(async () => {
    alice = await makeUser('Alice', 'alice@test.com');
    bob = await makeUser('Bob', 'bob@test.com');
    aliceToken = await loginAs('alice@test.com');
    bobToken = await loginAs('bob@test.com');
    lead = await Lead.create({ name: 'Lead One', email: 'one@x.com', phone: '1234567' });
  });

  const newTask = (overrides = {}) => ({
    title: 'Call the lead',
    lead: String(lead._id),
    assignedTo: String(alice._id),
    dueDate: new Date().toISOString(),
    ...overrides,
  });

  it('creates tasks for a lead and assigns them to a user; status always starts Pending', async () => {
    const res = await authed('post', '/api/tasks', bobToken).send({ ...newTask(), status: 'Completed' });
    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'Pending');
    assert.equal(res.body.data.assignedTo, String(alice._id));
  });

  it('validates task input and references', async () => {
    assert.equal((await authed('post', '/api/tasks', aliceToken).send(newTask({ title: '' }))).status, 400);
    assert.equal((await authed('post', '/api/tasks', aliceToken).send(newTask({ dueDate: 'tomorrow-ish' }))).status, 400);
    assert.equal((await authed('post', '/api/tasks', aliceToken).send(newTask({ lead: String(new mongoose.Types.ObjectId()) }))).status, 400);
    assert.equal((await authed('post', '/api/tasks', aliceToken).send(newTask({ assignedTo: String(new mongoose.Types.ObjectId()) }))).status, 400);
  });

  it('lets only the assigned user update the task status', async () => {
    const created = await authed('post', '/api/tasks', aliceToken).send(newTask());
    const id = created.body.data._id;

    const forbidden = await authed('patch', `/api/tasks/${id}/status`, bobToken).send({ status: 'Completed' });
    assert.equal(forbidden.status, 403);
    assert.equal((await Task.findById(id)).status, 'Pending', 'status must be unchanged after a forbidden attempt');

    const allowed = await authed('patch', `/api/tasks/${id}/status`, aliceToken).send({ status: 'Completed' });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.body.data.status, 'Completed');
  });

  it('ignores any attempt to claim identity through the request body', async () => {
    const created = await authed('post', '/api/tasks', aliceToken).send(newTask());
    const id = created.body.data._id;

    const res = await authed('patch', `/api/tasks/${id}/status`, bobToken).send({ status: 'Completed', assignedTo: String(bob._id), user: String(alice._id) });
    assert.equal(res.status, 403);
  });

  it('rejects unauthenticated, invalid and unknown status updates', async () => {
    const created = await authed('post', '/api/tasks', aliceToken).send(newTask());
    const id = created.body.data._id;

    assert.equal((await request(app).patch(`/api/tasks/${id}/status`).send({ status: 'Completed' })).status, 401);
    assert.equal((await authed('patch', `/api/tasks/${id}/status`, aliceToken).send({ status: 'Done-ish' })).status, 400);
    assert.equal((await authed('patch', `/api/tasks/${new mongoose.Types.ObjectId()}/status`, aliceToken).send({ status: 'Completed' })).status, 404);
  });

  it('hides tasks that belong to soft-deleted leads', async () => {
    await authed('post', '/api/tasks', aliceToken).send(newTask());
    assert.equal((await authed('get', '/api/tasks', aliceToken)).body.pagination.total, 1);

    await authed('delete', `/api/leads/${lead._id}`, aliceToken);
    assert.equal((await authed('get', '/api/tasks', aliceToken)).body.pagination.total, 0);
  });

  it('filters tasks by assignee and status', async () => {
    await authed('post', '/api/tasks', aliceToken).send(newTask({ title: 'A' }));
    await authed('post', '/api/tasks', aliceToken).send(newTask({ title: 'B', assignedTo: String(bob._id) }));

    const mine = await authed('get', `/api/tasks?assignedTo=${bob._id}`, aliceToken);
    assert.deepEqual(mine.body.data.map((t) => t.title), ['B']);

    const pending = await authed('get', '/api/tasks?status=Pending', aliceToken);
    assert.equal(pending.body.pagination.total, 2);
  });
});

describe('dashboard', () => {
  it('computes every figure from the database and ignores soft-deleted leads', async () => {
    const user = await makeUser('Demo', 'demo@test.com');
    const token = await loginAs('demo@test.com');
    const { start, end, noon } = todayWindow();

    const [qualified, contacted, , deletedLead] = await Lead.create([
      { name: 'Q1', email: 'q1@x.com', phone: '1234567', status: 'Qualified' },
      { name: 'C1', email: 'c1@x.com', phone: '1234567', status: 'Contacted' },
      { name: 'Q2', email: 'q2@x.com', phone: '1234567', status: 'Qualified' },
      { name: 'Gone', email: 'g@x.com', phone: '1234567', status: 'Qualified', isDeleted: true },
    ]);

    const base = { assignedTo: user._id, createdBy: user._id };
    const yesterday = new Date(noon.getTime() - 24 * 3600 * 1000);
    await Task.create([
      { ...base, title: 'due today, pending', lead: qualified._id, dueDate: noon, status: 'Pending' },
      { ...base, title: 'due today, completed', lead: contacted._id, dueDate: noon, status: 'Completed' },
      { ...base, title: 'completed earlier', lead: contacted._id, dueDate: yesterday, status: 'Completed' },
      { ...base, title: 'on deleted lead (due today)', lead: deletedLead._id, dueDate: noon, status: 'Pending' },
      { ...base, title: 'on deleted lead (completed)', lead: deletedLead._id, dueDate: noon, status: 'Completed' },
    ]);

    const res = await authed('get', `/api/dashboard/stats?dayStart=${start.toISOString()}&dayEnd=${end.toISOString()}`, token);
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, {
      totalLeads: 3, // deleted lead excluded
      qualifiedLeads: 2, // deleted qualified lead excluded
      tasksDueToday: 1, // only the open task due today on an active lead
      completedTasks: 2, // completed tasks on the deleted lead are excluded
    });
  });

  it('returns zeros on an empty database and requires authentication', async () => {
    await makeUser('Demo', 'demo@test.com');
    const token = await loginAs('demo@test.com');

    const res = await authed('get', '/api/dashboard/stats', token);
    assert.deepEqual(res.body.data, { totalLeads: 0, qualifiedLeads: 0, tasksDueToday: 0, completedTasks: 0 });

    assert.equal((await request(app).get('/api/dashboard/stats')).status, 401);
  });
});
