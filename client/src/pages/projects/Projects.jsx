import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiFlag, FiPlus,
  FiSearch, FiUsers, FiX, FiGrid, FiList,
} from 'react-icons/fi';
import { projectService } from '../../services/projectService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './projects.css';

const projectStatuses = {
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const taskStatuses = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
};
const priorities = ['low', 'medium', 'high', 'urgent'];
const labelFor = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
const employeeName = (employee) => employee?.user?.name || employee?.name || 'Unassigned';
const getProjectErrorMessage = (error, fallback) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ERR_NETWORK' || !error.response) {
    return 'CRM server se connection nahi ho raha. Backend server ko port 5000 par start karke dobara try karein.';
  }
  if (error.response.status === 401) return 'Session expire ho gaya hai. Dobara login karke try karein.';
  if (error.response.status === 403) return 'Aapke account ko project create karne ki permission nahi hai.';
  return `${fallback} (HTTP ${error.response.status})`;
};

const Projects = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '', description: '', priority: 'medium', startDate: '', dueDate: '', projectManager: '', team: [],
  });
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '',
  });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', dueDate: '' });
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [updateForm, setUpdateForm] = useState({ message: '', progress: 0 });
  const [taskView, setTaskView] = useState('kanban');

  const canCreateProjects = isAdmin || isSuperAdmin;
  const employeeOptions = useMemo(() => {
    const options = [...employees, ...(project?.team || [])];
    return [...new Map(options.map((employee) => [String(employee._id), employee])).values()];
  }, [employees, project?.team]);
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (id) {
        const response = await projectService.getProject(id);
        setProject(response.data.data);
      } else {
        const response = await projectService.getProjects({ search: search.trim(), status: statusFilter });
        setProjects(response.data.data || []);
      }
    } catch (requestError) {
      console.error('Error loading projects:', requestError);
      setError(requestError.response?.data?.message || 'Could not load projects.');
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [id, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProjects, id ? 0 : 250);
    return () => clearTimeout(timer);
  }, [fetchProjects, id]);

  useEffect(() => {
    employeeService.getEmployees({ limit: 100, status: 'active' })
      .then((response) => {
        const data = response.data?.data || response.data?.employees || [];
        setEmployees(Array.isArray(data) ? data : []);
      })
      .catch((employeeError) => {
        console.error('Error loading project team options:', employeeError);
      });
  }, []);

  const canManageProject = useMemo(() => {
    if (!project) return canCreateProjects;
    const currentUserId = user?._id || user?.id;
    const managerUserId = project.projectManager?.user?._id || project.projectManager?.user?.id;
    const creatorId = project.createdBy?._id || project.createdBy;
    return canCreateProjects || String(currentUserId) === String(managerUserId) || String(currentUserId) === String(creatorId);
  }, [canCreateProjects, project, user]);

  const openProjectModal = () => {
    setProjectForm({ name: '', description: '', priority: 'medium', startDate: '', dueDate: '', projectManager: '', team: [] });
    setModal('project');
  };

  const submitProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...projectForm,
        startDate: projectForm.startDate || null,
        dueDate: projectForm.dueDate || null,
      };
      if (editingProject && id) await projectService.updateProject(id, payload);
      else await projectService.createProject(payload);
      setModal('');
      setEditingProject(false);
      if (id) await refreshProject();
      else await fetchProjects();
    } catch (requestError) {
      setError(getProjectErrorMessage(requestError, 'Project create nahi hua.'));
    } finally {
      setSaving(false);
    }
  };

  const refreshProject = async () => {
    const response = await projectService.getProject(id);
    setProject(response.data.data);
  };

  const submitTask = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...taskForm, dueDate: taskForm.dueDate || null };
      if (editingTask) await projectService.updateTask(id, editingTask._id, payload);
      else await projectService.createTask(id, payload);
      setModal('');
      setEditingTask(null);
      setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create task.');
    } finally {
      setSaving(false);
    }
  };

  const submitMilestone = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...milestoneForm, dueDate: milestoneForm.dueDate || null };
      if (editingMilestone) {
        await projectService.updateMilestone(id, editingMilestone._id, payload);
      } else {
        await projectService.addMilestone(id, payload);
      }
      setModal('');
      setEditingMilestone(null);
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save milestone.');
    } finally {
      setSaving(false);
    }
  };

  const saveTaskStatus = async (task, status) => {
    setError('');
    try {
      await projectService.updateTask(id, task._id, { status });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update task status.');
    }
  };

  const submitWorkUpdate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await projectService.addWorkUpdate(id, selectedTask._id, updateForm);
      setModal('');
      setSelectedTask(null);
      setUpdateForm({ message: '', progress: 0 });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not submit work update.');
    } finally {
      setSaving(false);
    }
  };

  const changeProjectStatus = async (status) => {
    try {
      await projectService.updateProject(id, { status });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update project status.');
    }
  };

  const updateMilestoneStatus = async (milestone, status) => {
    try {
      await projectService.updateMilestone(id, milestone._id, { status });
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update milestone.');
    }
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateForm({ message: '', progress: task.progress || 0 });
    setModal('update');
  };

  const openEditProject = () => {
    setEditingProject(true);
    setProjectForm({
      name: project.name || '',
      description: project.description || '',
      priority: project.priority || 'medium',
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().slice(0, 10) : '',
      projectManager: project.projectManager?._id || '',
      team: (project.team || []).map((employee) => employee._id),
    });
    setModal('project');
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    setModal('task');
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    });
    setModal('task');
  };

  const archiveTask = async (task) => {
    if (!window.confirm(`Archive task "${task.title}"?`)) return;
    try {
      await projectService.archiveTask(id, task._id);
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not archive task.');
    }
  };

  const deleteMilestone = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"?`)) return;
    try {
      await projectService.deleteMilestone(id, milestone._id);
      await refreshProject();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete milestone.');
    }
  };

  const openCreateMilestone = () => {
    setEditingMilestone(null);
    setMilestoneForm({ title: '', description: '', dueDate: '' });
    setModal('milestone');
  };

  const openEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      title: milestone.title || '',
      description: milestone.description || '',
      dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : '',
    });
    setModal('milestone');
  };

  const archiveProject = async () => {
    if (!window.confirm(`Archive project "${project.name}"?`)) return;
    try {
      await projectService.archiveProject(id);
      navigate('/projects');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not archive project.');
    }
  };

  if (loading) return <div className="projects-page"><Loader /></div>;

  return (
    <main className="projects-page">
      {error && <div className="projects-alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><FiX /></button></div>}

      {!id ? (
        <>
          <header className="projects-header">
            <div>
              <span className="projects-eyebrow"><FiCheckCircle /> WORK MANAGEMENT</span>
              <h1>Projects</h1>
              <p>Plan work, assign tasks and follow team progress.</p>
            </div>
            {canCreateProjects && <button className="projects-primary" onClick={openProjectModal}><FiPlus /> New project</button>}
          </header>

          <section className="projects-toolbar">
            <label className="projects-search"><FiSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" /></label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter projects by status">
              <option value="">All statuses</option>
              {Object.entries(projectStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </section>

          {projects.length === 0 ? (
            <div className="projects-empty">
              <FiCheckCircle />
              <h2>No projects found</h2>
              <p>{canCreateProjects ? 'Create your first project to organize team work.' : 'You are not assigned to any active projects yet.'}</p>
              {canCreateProjects && <button className="projects-primary" onClick={openProjectModal}><FiPlus /> Create project</button>}
            </div>
          ) : (
            <section className="projects-grid">
              {projects.map((item) => (
                <Link className="project-card" key={item._id} to={`/projects/${item._id}`}>
                  <div className="project-card__top">
                    <span className={`project-status project-status--${item.status}`}>{projectStatuses[item.status]}</span>
                    <span className={`project-priority project-priority--${item.priority}`}><FiFlag /> {labelFor(item.priority)}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p className="project-card__description">{item.description || 'No description provided.'}</p>
                  <div className="project-progress"><div><span>Progress</span><strong>{item.taskSummary?.progress || 0}%</strong></div><div className="project-progress__track"><span style={{ width: `${item.taskSummary?.progress || 0}%` }} /></div></div>
                  <footer><span><FiUsers /> {item.team?.length || 0} members</span><span><FiCheckCircle /> {item.taskSummary?.done || 0}/{item.taskSummary?.count || 0} tasks</span></footer>
                  {item.dueDate && <div className="project-card__date"><FiCalendar /> Due {new Date(item.dueDate).toLocaleDateString()}</div>}
                </Link>
              ))}
            </section>
          )}
        </>
      ) : !project ? (
        <div className="projects-empty"><h2>Project not available</h2><p>{error || 'This project may have been archived or you may not have access.'}</p><button className="projects-secondary" onClick={() => navigate('/projects')}><FiArrowLeft /> Back to projects</button></div>
      ) : (
        <>
          <button className="projects-back" onClick={() => navigate('/projects')}><FiArrowLeft /> All projects</button>
          <header className="projects-header projects-header--detail">
            <div>
              <span className="projects-eyebrow"><FiCheckCircle /> PROJECT DETAILS</span>
              <h1>{project.name}</h1>
              <p>{project.description || 'No project description.'}</p>
            </div>
            {canManageProject && <div className="projects-detail-actions">
              <button className="projects-secondary" onClick={openEditProject}>Edit project</button>
              <button className="projects-secondary" onClick={archiveProject}>Archive</button>
              <select className="projects-status-select" aria-label="Project status" value={project.status} onChange={(event) => changeProjectStatus(event.target.value)}>
                {Object.entries(projectStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>}
          </header>

          <section className="project-summary">
            <div><span>Progress</span><strong>{project.taskSummary?.progress || 0}%</strong><div className="project-progress__track"><span style={{ width: `${project.taskSummary?.progress || 0}%` }} /></div></div>
            <div><span>Status</span><strong>{projectStatuses[project.status]}</strong></div>
            <div><span>Priority</span><strong>{labelFor(project.priority)}</strong></div>
            <div><span>Timeline</span><strong>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'} – {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}</strong></div>
            <div><span>Project manager</span><strong>{employeeName(project.projectManager)}</strong></div>
          </section>

          <section className="project-panel">
            <div className="project-panel__heading">
              <div>
                <h2>Tasks</h2>
                <p>{project.tasks?.length || 0} tasks in this project</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="project-view-switch">
                  <button
                    type="button"
                    className={`project-view-btn ${taskView === 'kanban' ? 'active' : ''}`}
                    onClick={() => setTaskView('kanban')}
                  >
                    <FiGrid /> Board
                  </button>
                  <button
                    type="button"
                    className={`project-view-btn ${taskView === 'list' ? 'active' : ''}`}
                    onClick={() => setTaskView('list')}
                  >
                    <FiList /> List
                  </button>
                </div>
                {canManageProject && <button className="projects-primary" onClick={openCreateTask}><FiPlus /> Add task</button>}
              </div>
            </div>
            {!project.tasks?.length ? (
              <div className="project-inline-empty">No tasks have been added to this project.</div>
            ) : taskView === 'kanban' ? (
              <div className="kanban-board">
                {[
                  { key: 'todo', label: 'To Do', color: 'todo' },
                  { key: 'in_progress', label: 'In Progress', color: 'in_progress' },
                  { key: 'blocked', label: 'Blocked', color: 'in_review' },
                  { key: 'done', label: 'Completed', color: 'done' },
                ].map((col) => {
                  const colTasks = project.tasks.filter((t) => (t.status || 'todo') === col.key);
                  return (
                    <div className="kanban-column" key={col.key}>
                      <div className="kanban-column__header">
                        <div className="kanban-column__title">
                          <span className={`kanban-dot kanban-dot--${col.color}`} />
                          <span>{col.label}</span>
                        </div>
                        <span className="kanban-column__count">{colTasks.length}</span>
                      </div>

                      <div className="kanban-column__cards">
                        {colTasks.length === 0 ? (
                          <div style={{ padding: '16px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                            No tasks in {col.label}
                          </div>
                        ) : (
                          colTasks.map((task) => {
                            const currentUserId = user?._id || user?.id;
                            const assigneeUserId = task.assignedTo?.user?._id || task.assignedTo?.user?.id;
                            const canUpdateTask = canManageProject || String(currentUserId) === String(assigneeUserId);

                            return (
                              <article className="kanban-card" key={task._id}>
                                <div className="kanban-card__top">
                                  <span className={`project-priority project-priority--${task.priority}`}>
                                    <FiFlag /> {labelFor(task.priority)}
                                  </span>
                                  {canUpdateTask && (
                                    <button
                                      type="button"
                                      className="projects-secondary projects-secondary--small"
                                      style={{ padding: '2px 6px', fontSize: '11px' }}
                                      onClick={() => openUpdateModal(task)}
                                    >
                                      Update
                                    </button>
                                  )}
                                </div>

                                <h4 className="kanban-card__title">{task.title}</h4>
                                {task.description && (
                                  <p className="kanban-card__desc">{task.description}</p>
                                )}

                                <div className="kanban-card__progress">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                                    <span>Progress</span>
                                    <strong>{task.progress || 0}%</strong>
                                  </div>
                                  <div className="kanban-progress__bar">
                                    <div
                                      className={`kanban-progress__fill ${task.status === 'done' ? 'kanban-progress__fill--done' : ''}`}
                                      style={{ width: `${task.progress || 0}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="kanban-card__footer">
                                  <span><FiUsers /> {employeeName(task.assignedTo)}</span>
                                  <span><FiCalendar /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>

                                  {canUpdateTask && (
                                    <div className="kanban-card__actions">
                                      <select
                                        className="kanban-move-select"
                                        aria-label={`Move task ${task.title}`}
                                        value={task.status}
                                        onChange={(event) => saveTaskStatus(task, event.target.value)}
                                      >
                                        {Object.entries(taskStatuses).map(([value, label]) => (
                                          <option key={value} value={value}>Move: {label}</option>
                                        ))}
                                      </select>
                                      {canManageProject && (
                                        <button
                                          type="button"
                                          className="projects-secondary projects-secondary--small"
                                          style={{ padding: '2px 6px', fontSize: '11px' }}
                                          onClick={() => openEditTask(task)}
                                        >
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </article>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="project-task-list">
                {project.tasks.map((task) => {
                  const currentUserId = user?._id || user?.id;
                  const assigneeUserId = task.assignedTo?.user?._id || task.assignedTo?.user?.id;
                  const canUpdateTask = canManageProject || String(currentUserId) === String(assigneeUserId);
                  return (
                    <article className="project-task" key={task._id}>
                      <div className="project-task__main"><div><h3>{task.title}</h3><p>{task.description || 'No task description.'}</p></div>
                        <span className={`project-priority project-priority--${task.priority}`}><FiFlag /> {labelFor(task.priority)}</span>
                      </div>
                      <div className="project-task__meta">
                        <span><FiUsers /> {employeeName(task.assignedTo)}</span>
                        <span><FiCalendar /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</span>
                        <span>{task.progress || 0}%</span>
                        {canUpdateTask ? <select aria-label={`Task status for ${task.title}`} value={task.status} onChange={(event) => saveTaskStatus(task, event.target.value)}>
                          {Object.entries(taskStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select> : <span className={`project-status project-status--${task.status}`}>{taskStatuses[task.status]}</span>}
                        {canUpdateTask && <button className="projects-secondary projects-secondary--small" onClick={() => openUpdateModal(task)}>Post update</button>}
                        {canManageProject && <button className="projects-secondary projects-secondary--small" onClick={() => openEditTask(task)}>Edit</button>}
                        {canManageProject && <button className="projects-danger projects-secondary--small" onClick={() => archiveTask(task)}>Archive</button>}
                      </div>
                      {task.workUpdates?.length > 0 && <details className="project-updates"><summary>Recent work updates ({task.workUpdates.length})</summary>{[...task.workUpdates].reverse().slice(0, 5).map((update) => <div className="project-update" key={update._id}><p>{update.message}</p><span>{update.progress}% · {update.createdBy?.name || 'Team member'} · {new Date(update.createdAt).toLocaleString()}</span></div>)}</details>}
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="project-panel">
            <div className="project-panel__heading"><div><h2>Milestones</h2><p>Key dates and delivery checkpoints</p></div>{canManageProject && <button className="projects-secondary" onClick={openCreateMilestone}><FiPlus /> Add milestone</button>}</div>
            {!project.milestones?.length ? <div className="project-inline-empty">No milestones planned.</div> : <div className="project-milestones">{project.milestones.map((milestone) => <article className="project-milestone" key={milestone._id}><div><strong>{milestone.title}</strong><p>{milestone.description || 'No description'}</p><span><FiCalendar /> {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : 'No due date'}</span></div>{canManageProject ? <div className="project-milestone__actions"><select aria-label={`Status for milestone ${milestone.title}`} value={milestone.status} onChange={(event) => updateMilestoneStatus(milestone, event.target.value)}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select><button type="button" className="projects-secondary projects-secondary--small" onClick={() => openEditMilestone(milestone)}>Edit</button><button type="button" className="projects-danger projects-secondary--small" onClick={() => deleteMilestone(milestone)}>Delete</button></div> : <span className="project-status">{labelFor(milestone.status)}</span>}</article>)}</div>}
          </section>
        </>
      )}

      <Modal isOpen={modal === 'project'} onClose={() => { setModal(''); setEditingProject(false); }} title={editingProject ? 'Edit project' : 'Create project'}>
        <form className="projects-form" onSubmit={submitProject}>
          <label>Project name *<input required maxLength={160} value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} /></label>
          <label>Description<textarea maxLength={5000} rows={3} value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /></label>
          <div className="projects-form__row"><label>Priority<select value={projectForm.priority} onChange={(event) => setProjectForm({ ...projectForm, priority: event.target.value })}>{priorities.map((priority) => <option key={priority} value={priority}>{labelFor(priority)}</option>)}</select></label><label>Project manager<select value={projectForm.projectManager} onChange={(event) => setProjectForm({ ...projectForm, projectManager: event.target.value })}><option value="">Select manager</option>{employeeOptions.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)}</option>)}</select></label></div>
          <div className="projects-form__row"><label>Start date<input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm({ ...projectForm, startDate: event.target.value })} /></label><label>Due date<input type="date" min={projectForm.startDate || undefined} value={projectForm.dueDate} onChange={(event) => setProjectForm({ ...projectForm, dueDate: event.target.value })} /></label></div>
          <label>Team members<select multiple value={projectForm.team} onChange={(event) => setProjectForm({ ...projectForm, team: Array.from(event.target.selectedOptions, (option) => option.value) })}>{employeeOptions.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)}{employee.department ? ` · ${employee.department}` : ''}</option>)}</select><small>Use Ctrl (Windows) or Command (Mac) to select multiple people.</small></label>
          <div className="projects-form__actions"><button type="button" className="projects-secondary" onClick={() => { setModal(''); setEditingProject(false); }}>Cancel</button><button className="projects-primary" disabled={saving}>{saving ? 'Saving…' : editingProject ? 'Save changes' : 'Create project'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'task'} onClose={() => { setModal(''); setEditingTask(null); }} title={editingTask ? 'Edit project task' : 'Add project task'}>
        <form className="projects-form" onSubmit={submitTask}>
          <label>Task title *<input required maxLength={160} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label>
          <label>Description<textarea rows={3} maxLength={3000} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} /></label>
          <div className="projects-form__row"><label>Assignee<select value={taskForm.assignedTo} onChange={(event) => setTaskForm({ ...taskForm, assignedTo: event.target.value })}><option value="">Unassigned</option>{project?.team?.map((employee) => <option key={employee._id} value={employee._id}>{employeeName(employee)}</option>)}</select></label><label>Priority<select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}>{priorities.map((priority) => <option key={priority} value={priority}>{labelFor(priority)}</option>)}</select></label></div>
          <label>Due date<input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /></label>
          <div className="projects-form__actions"><button type="button" className="projects-secondary" onClick={() => { setModal(''); setEditingTask(null); }}>Cancel</button><button className="projects-primary" disabled={saving}>{saving ? 'Saving…' : editingTask ? 'Save task' : 'Add task'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'milestone'} onClose={() => { setModal(''); setEditingMilestone(null); }} title={editingMilestone ? 'Edit milestone' : 'Add milestone'}>
        <form className="projects-form" onSubmit={submitMilestone}>
          <label>Milestone title *<input required maxLength={160} value={milestoneForm.title} onChange={(event) => setMilestoneForm({ ...milestoneForm, title: event.target.value })} /></label>
          <label>Description<textarea rows={2} maxLength={2000} value={milestoneForm.description} onChange={(event) => setMilestoneForm({ ...milestoneForm, description: event.target.value })} /></label>
          <label>Due date<input type="date" value={milestoneForm.dueDate} onChange={(event) => setMilestoneForm({ ...milestoneForm, dueDate: event.target.value })} /></label>
          <div className="projects-form__actions"><button type="button" className="projects-secondary" onClick={() => { setModal(''); setEditingMilestone(null); }}>Cancel</button><button className="projects-primary" disabled={saving}>{saving ? 'Saving…' : editingMilestone ? 'Save milestone' : 'Add milestone'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={modal === 'update'} onClose={() => setModal('')} title={`Work update${selectedTask ? `: ${selectedTask.title}` : ''}`}>
        <form className="projects-form" onSubmit={submitWorkUpdate}>
          <label>What did you work on? *<textarea required rows={4} maxLength={2000} value={updateForm.message} onChange={(event) => setUpdateForm({ ...updateForm, message: event.target.value })} /></label>
          <label>Task progress ({updateForm.progress}%)<input type="range" min="0" max="100" step="5" value={updateForm.progress} onChange={(event) => setUpdateForm({ ...updateForm, progress: Number(event.target.value) })} /></label>
          <div className="projects-form__actions"><button type="button" className="projects-secondary" onClick={() => setModal('')}>Cancel</button><button className="projects-primary" disabled={saving}>{saving ? 'Posting…' : 'Post update'}</button></div>
        </form>
      </Modal>
    </main>
  );
};

export default Projects;
