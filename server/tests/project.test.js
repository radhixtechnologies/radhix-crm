require('dotenv').config();
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');

// Models
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const Employee = require('../models/Employee');
const User = require('../models/User');

// Controller
const projectCtrl = require('../controllers/projectController');

// Mock req and res helper
const mockResponse = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
};

describe('Project Management Module Test Suite', () => {
  let adminUser;
  let employeeUser1;
  let employeeUser2;
  let employeeUser3;
  let employee1;
  let employee2;
  let employee3;
  let testProject;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (mongoUri && mongoose.connection.readyState === 0) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      } catch (err) {
        console.warn('MongoDB connection failed in test runner; skipping live DB tests if DB is offline:', err.message);
      }
    }

    if (mongoose.connection.readyState === 1) {
      const timestamp = Date.now();

      // 1. Admin User
      adminUser = await User.create({
        name: 'Project Admin',
        email: `proj_admin_${timestamp}@example.com`,
        password: 'password123',
        role: 'admin',
        isActive: true,
      });

      // 2. Employee 1 User (Project Manager)
      employeeUser1 = await User.create({
        name: 'Alex Manager',
        email: `alex_pm_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });
      employee1 = await Employee.create({
        user: employeeUser1._id,
        employeeId: `EMP-${timestamp}-1`,
        department: 'IT',
        designation: 'Tech Lead',
        status: 'active',
      });

      // 3. Employee 2 User (Team Member)
      employeeUser2 = await User.create({
        name: 'Sam Developer',
        email: `sam_dev_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });
      employee2 = await Employee.create({
        user: employeeUser2._id,
        employeeId: `EMP-${timestamp}-2`,
        department: 'IT',
        designation: 'Software Engineer',
        status: 'active',
      });

      // 4. Employee 3 User (Unassigned Employee)
      employeeUser3 = await User.create({
        name: 'Dana Designer',
        email: `dana_des_${timestamp}@example.com`,
        password: 'password123',
        role: 'employee',
        isActive: true,
      });
      employee3 = await Employee.create({
        user: employeeUser3._id,
        employeeId: `EMP-${timestamp}-3`,
        department: 'Operations',
        designation: 'Product Designer',
        status: 'active',
      });
    }
  });

  after(async () => {
    if (mongoose.connection.readyState === 1) {
      // Clean up all test data
      if (testProject) {
        await ProjectTask.deleteMany({ project: testProject._id });
        await Project.findByIdAndDelete(testProject._id);
      }
      if (adminUser) await User.findByIdAndDelete(adminUser._id);
      if (employeeUser1) await User.findByIdAndDelete(employeeUser1._id);
      if (employeeUser2) await User.findByIdAndDelete(employeeUser2._id);
      if (employeeUser3) await User.findByIdAndDelete(employeeUser3._id);
      if (employee1) await Employee.findByIdAndDelete(employee1._id);
      if (employee2) await Employee.findByIdAndDelete(employee2._id);
      if (employee3) await Employee.findByIdAndDelete(employee3._id);

      await mongoose.disconnect();
    }
  });

  describe('1. Model Validations', () => {
    test('Project model validation: requires name and createdBy', () => {
      const invalidProject = new Project({});
      const err = invalidProject.validateSync();
      assert.ok(err, 'Validation should fail for empty project');
      assert.ok(err.errors.name, 'Project name is required');
      assert.ok(err.errors.createdBy, 'createdBy is required');
    });

    test('ProjectTask model validation: requires project, title, createdBy', () => {
      const invalidTask = new ProjectTask({});
      const err = invalidTask.validateSync();
      assert.ok(err, 'Validation should fail for empty task');
      assert.ok(err.errors.project, 'Project reference is required');
      assert.ok(err.errors.title, 'Task title is required');
      assert.ok(err.errors.createdBy, 'createdBy is required');
    });

    test('Task workUpdate validation: progress must be between 0 and 100', () => {
      const task = new ProjectTask({
        project: new mongoose.Types.ObjectId(),
        title: 'Validation Task',
        createdBy: new mongoose.Types.ObjectId(),
        workUpdates: [
          { message: 'Update message', progress: 150, createdBy: new mongoose.Types.ObjectId() },
        ],
      });
      const err = task.validateSync();
      assert.ok(err, 'Validation should fail for progress > 100');
      assert.ok(err.errors['workUpdates.0.progress']);
    });
  });

  describe('2. Project Creation & Permissions', () => {
    test('Non-admin employee cannot create a project', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: { name: 'Unauthorized Project' },
        user: employeeUser2,
      };
      const res = mockResponse();
      await projectCtrl.createProject(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.match(res.data.message, /administrator/i);
    });

    test('Rejects project creation when due date is earlier than start date', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: {
          name: 'Invalid Dates Project',
          startDate: '2026-10-01',
          dueDate: '2026-09-01',
        },
        user: adminUser,
      };
      const res = mockResponse();
      await projectCtrl.createProject(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /Due date cannot be before/i);
    });

    test('Admin successfully creates project with manager and team', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        body: {
          name: 'CRM 2.0 Redesign',
          description: 'Revamp the core CRM modules and UI',
          priority: 'high',
          startDate: '2026-10-01',
          dueDate: '2026-12-31',
          projectManager: employee1._id,
          team: [employee1._id, employee2._id],
        },
        user: adminUser,
      };
      const res = mockResponse();
      await projectCtrl.createProject(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);

      testProject = res.data.data;
      assert.ok(testProject._id);
      assert.strictEqual(testProject.name, 'CRM 2.0 Redesign');
      assert.strictEqual(testProject.priority, 'high');
      assert.strictEqual(testProject.status, 'planned');
      assert.strictEqual(String(testProject.projectManager._id), String(employee1._id));
      assert.strictEqual(testProject.team.length, 2);
    });
  });

  describe('3. Project Listing & Access Control', () => {
    test('Admin sees all projects in list', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { query: {}, user: adminUser };
      const res = mockResponse();
      await projectCtrl.listProjects(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.success, true);
      const found = res.data.data.some((p) => String(p._id) === String(testProject._id));
      assert.ok(found, 'Admin should see test project');
    });

    test('Assigned team member sees project in list', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { query: {}, user: employeeUser2 };
      const res = mockResponse();
      await projectCtrl.listProjects(req, res);
      assert.strictEqual(res.statusCode, 200);
      const found = res.data.data.some((p) => String(p._id) === String(testProject._id));
      assert.ok(found, 'Team member employee2 should see assigned project');
    });

    test('Unassigned employee does NOT see project in list', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { query: {}, user: employeeUser3 };
      const res = mockResponse();
      await projectCtrl.listProjects(req, res);
      assert.strictEqual(res.statusCode, 200);
      const found = res.data.data.some((p) => String(p._id) === String(testProject._id));
      assert.strictEqual(found, false, 'Unassigned employee3 should NOT see project');
    });

    test('Unassigned employee receives 403 on getProject detail', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { params: { id: testProject._id }, user: employeeUser3 };
      const res = mockResponse();
      await projectCtrl.getProject(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.match(res.data.message, /access/i);
    });
  });

  describe('4. Tasks & Assignments', () => {
    let testTask;

    test('Task creation rejects assignee outside project team', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id },
        body: {
          title: 'Design Mockups',
          assignedTo: employee3._id, // employee3 is not in team
        },
        user: employeeUser1, // project manager
      };
      const res = mockResponse();
      await projectCtrl.createProjectTask(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /must belong to the project team/i);
    });

    test('Project manager successfully creates and assigns task to team member', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id },
        body: {
          title: 'Implement Authentication API',
          description: 'Setup JWT authentication and access tokens',
          assignedTo: employee2._id,
          priority: 'high',
          dueDate: '2026-11-15',
        },
        user: employeeUser1, // project manager
      };
      const res = mockResponse();
      await projectCtrl.createProjectTask(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);

      testTask = res.data.data;
      assert.strictEqual(testTask.title, 'Implement Authentication API');
      assert.strictEqual(String(testTask.assignedTo._id), String(employee2._id));
      assert.strictEqual(testTask.status, 'todo');
      assert.strictEqual(testTask.progress, 0);
    });

    test('Assigned employee submits work update with progress history', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id, taskId: testTask._id },
        body: {
          message: 'Completed JWT generation and login endpoint',
          progress: 60,
        },
        user: employeeUser2, // assigned employee
      };
      const res = mockResponse();
      await projectCtrl.addWorkUpdate(req, res);
      assert.strictEqual(res.statusCode, 201);

      const updatedTask = res.data.data;
      assert.strictEqual(updatedTask.progress, 60);
      assert.strictEqual(updatedTask.status, 'in_progress');
      assert.strictEqual(updatedTask.workUpdates.length, 1);
      assert.strictEqual(updatedTask.workUpdates[0].message, 'Completed JWT generation and login endpoint');
      assert.strictEqual(updatedTask.workUpdates[0].progress, 60);
    });

    test('Setting task status to done sets progress to 100%', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id, taskId: testTask._id },
        body: { status: 'done' },
        user: employeeUser2,
      };
      const res = mockResponse();
      await projectCtrl.updateProjectTask(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.data.status, 'done');
      assert.strictEqual(res.data.data.progress, 100);
    });

    test('Task progress reflects in getProject taskSummary', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = { params: { id: testProject._id }, user: employeeUser1 };
      const res = mockResponse();
      await projectCtrl.getProject(req, res);
      assert.strictEqual(res.statusCode, 200);
      const summary = res.data.data.taskSummary;
      assert.strictEqual(summary.count, 1);
      assert.strictEqual(summary.done, 1);
      assert.strictEqual(summary.progress, 100);
    });

    test('Cannot remove team member from project while active tasks are assigned to them', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      // Attempt to update project team to only employee1 (removing employee2 who has testTask)
      const req = {
        params: { id: testProject._id },
        body: { team: [employee1._id] },
        user: adminUser,
      };
      const res = mockResponse();
      await projectCtrl.updateProject(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(res.data.message, /Reassign or unassign project tasks/i);
    });

    test('Project manager archives task successfully', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id, taskId: testTask._id },
        user: employeeUser1,
      };
      const res = mockResponse();
      await projectCtrl.archiveProjectTask(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.message, 'Project task archived');

      const archived = await ProjectTask.findById(testTask._id);
      assert.strictEqual(archived.isArchived, true);
    });
  });

  describe('5. Milestones Lifecycle', () => {
    let testMilestoneId;

    test('Add milestone to project', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id },
        body: {
          title: 'Beta Release v1.0',
          description: 'Deploy to staging for internal team review',
          dueDate: '2026-11-30',
        },
        user: employeeUser1, // project manager
      };
      const res = mockResponse();
      await projectCtrl.addMilestone(req, res);
      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(res.data.success, true);
      assert.strictEqual(res.data.data.title, 'Beta Release v1.0');
      assert.strictEqual(res.data.data.status, 'pending');

      testMilestoneId = res.data.data._id;
    });

    test('Update milestone status and details', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id, milestoneId: testMilestoneId },
        body: {
          title: 'Beta Release v1.0 (Completed)',
          status: 'completed',
        },
        user: employeeUser1,
      };
      const res = mockResponse();
      await projectCtrl.updateMilestone(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.data.title, 'Beta Release v1.0 (Completed)');
      assert.strictEqual(res.data.data.status, 'completed');
      assert.ok(res.data.data.completedAt, 'completedAt should be timestamped');
    });

    test('Delete milestone from project', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id, milestoneId: testMilestoneId },
        user: employeeUser1,
      };
      const res = mockResponse();
      await projectCtrl.deleteMilestone(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.message, 'Milestone deleted');

      const project = await Project.findById(testProject._id);
      const exists = project.milestones.id(testMilestoneId);
      assert.strictEqual(exists, null);
    });
  });

  describe('6. Project Archive & Updates', () => {
    test('Project manager updates project status to active', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id },
        body: { status: 'active' },
        user: employeeUser1,
      };
      const res = mockResponse();
      await projectCtrl.updateProject(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.data.status, 'active');
    });

    test('Project manager archives project', async (t) => {
      if (mongoose.connection.readyState !== 1) return t.skip('Database offline');

      const req = {
        params: { id: testProject._id },
        user: employeeUser1,
      };
      const res = mockResponse();
      await projectCtrl.archiveProject(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.data.message, 'Project archived');

      const project = await Project.findById(testProject._id);
      assert.strictEqual(project.isArchived, true);
    });
  });
});
