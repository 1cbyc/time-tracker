import React, { useMemo, useState, useCallback } from 'react';
import { Layout, Input, Button, Card, Space, Divider } from 'antd';
import { observer } from 'mobx-react';
import { createUseStyles } from 'react-jss';
import {
  Play,
  Pause,
  Plus,
  Clock,
  Tag,
  MoreHorizontal,
  BarChart2,
  Settings,
  Folder,
} from 'lucide-react';
import { Dropdown, Menu } from 'antd';
import { useHistory } from 'react-router-dom';

import rootStore from '../../modules/RootStore';
import TaskModel from '../../modules/tasks/models/TaskModel';
import TaskTimeItemModel from '../../modules/tasks/models/TaskTimeItemModel';
import { getTimeItems } from '../../helpers/TaskHelper';
import { msToTime } from '../../helpers/DateTime';
import ProjectModel from '../../modules/projects/models/ProjectModel';
import { v4 as uuid } from 'uuid';
import DrawerTask from '../projects/components/DrawerTask/DrawerTask';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const { Sider, Content } = Layout;
const { tasksStore, projectStore } = rootStore;

const TimerDashboard: React.FC = observer(() => {
  const classes = useStyles();
  const history = useHistory();
  const [currentTaskTitle, setCurrentTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [activeNavItem, setActiveNavItem] = useState('timer');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskModel | undefined>();

  const today = useMemo(() => new Date(), []);
  const todayTasks = useMemo(() => tasksStore.getTasksByDate(today), [today]);
  const timeItems = useMemo(() => getTimeItems(todayTasks, today), [todayTasks, today]);
  const activeTask = tasksStore.activeTask;

  // Timer display state - updates every second when timer is running
  const [timerSeconds, setTimerSeconds] = useState(0);

  React.useEffect(() => {
    if (activeTask?.active) {
      const interval = setInterval(() => {
        const durationMs = activeTask.duration;
        setTimerSeconds(Math.floor(durationMs / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
    setTimerSeconds(0);
    return undefined;
  }, [activeTask?.active, activeTask]);

  // Calculate stats
  const totalTimeToday = useMemo(() => {
    const totalMs = todayTasks.reduce((acc, task) => acc + task.getDurationByDate(today), 0);
    return msToTime(totalMs, false); // Format as HH:mm
  }, [todayTasks, today]);

  const activeProjectsCount = useMemo(() => {
    const projectIds = new Set(todayTasks.map(t => t.projectId).filter(Boolean));
    return projectIds.size;
  }, [todayTasks]);

  const mostTrackedProject = useMemo(() => {
    const projectTime: Record<string, number> = {};
    todayTasks.forEach(task => {
      if (task.projectId) {
        projectTime[task.projectId] = (projectTime[task.projectId] || 0) + task.getDurationByDate(today);
      }
    });
    const maxProjectId = Object.entries(projectTime).reduce((a, b) =>
      projectTime[a[0]] > projectTime[b[0]] ? a : b, ['', 0]
    )[0];
    return projectStore.get(maxProjectId);
  }, [todayTasks, today]);

  const handleStartStop = useCallback(() => {
    if (activeTask) {
      tasksStore.stopTimer();
    } else if (currentTaskTitle.trim()) {
      // Create a new task and start timer
      const projectId = selectedProject?.key || projectStore.activeProject || projectStore.projects[0]?.key || '';
      const newTask = new TaskModel({
        key: uuid(),
        title: currentTaskTitle.trim(),
        projectId,
        active: false,
        checked: false,
        expanded: true,
        time: [],
        datesInProgress: [],
        details: [],
        children: [],
        parent: undefined,
      });

      // Add task to store
      tasksStore.add(newTask);

      // Start timer
      tasksStore.startTimer(newTask);
      setCurrentTaskTitle('');
      setSelectedProject(null);
    }
  }, [activeTask, currentTaskTitle, selectedProject]);

  const handleProjectSelect = useCallback(() => {
    if (projectStore.projects.length === 0) return;
    const currentIndex = selectedProject
      ? projectStore.projects.findIndex((p) => p.key === selectedProject.key)
      : -1;
    const nextIndex = (currentIndex + 1) % projectStore.projects.length;
    setSelectedProject(projectStore.projects[nextIndex]);
  }, [selectedProject]);

  const handleRestartTimer = useCallback((task: TaskModel) => {
    tasksStore.startTimer(task);
  }, []);

  const handleEntryMenuClick = useCallback((item: TaskTimeItemModel, action: string) => {
    if (action === 'restart') {
      handleRestartTimer(item.task);
    } else if (action === 'edit') {
      setSelectedTask(item.task);
      setDrawerVisible(true);
    } else if (action === 'delete') {
      tasksStore.removeTime(item.task, item.index);
    }
  }, [handleRestartTimer]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
    setSelectedTask(undefined);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };


  return (
    <Layout className={classes.root}>
      {/* Sidebar */}
      <Sider width={256} className={classes.sider}>
        <div className={classes.sidebarHeader}>
          <div className={classes.logo}>
            <div className={classes.logoIconContainer}>
              <Clock className={classes.logoIcon} />
            </div>
            <span className={classes.logoText}>TimeTracker</span>
          </div>
        </div>

        <div className={classes.sidebarContent}>
          <Space direction="vertical" size={4} className={classes.nav}>
            <Button
              type="text"
              icon={<Clock size={16} />}
              className={`${classes.navButton} ${activeNavItem === 'timer' ? classes.navButtonActive : ''}`}
              onClick={() => {
                setActiveNavItem('timer');
                history.push('/timer');
              }}
            >
              Timer
            </Button>
            <Button
              type="text"
              icon={<BarChart2 size={16} />}
              className={classes.navButton}
              onClick={() => {
                setActiveNavItem('reports');
                history.push('/hours');
              }}
            >
              Reports
            </Button>
            <Button
              type="text"
              icon={<Folder size={16} />}
              className={classes.navButton}
              onClick={() => {
                setActiveNavItem('projects');
                history.push('/projects');
              }}
            >
              Projects
            </Button>
            <Button
              type="text"
              icon={<Tag size={16} />}
              className={classes.navButton}
              onClick={() => setActiveNavItem('tags')}
            >
              Tags
            </Button>
          </Space>

          <Divider className={classes.divider} />

          <div className={classes.projectsSection}>
            <div className={classes.projectsTitle}>Projects</div>
            <Space direction="vertical" size={4} className={classes.projectsList}>
              {projectStore.projects.slice(0, 4).map((project) => (
                <Button
                  key={project.key}
                  type="text"
                  className={classes.projectButton}
                  onClick={() => {
                    setSelectedProject(project);
                    projectStore.setActiveProject(project.key);
                  }}
                >
                  <span
                    className={classes.projectDot}
                    style={{ backgroundColor: project.color || '#1890ff' }}
                  />
                  {project.title}
                </Button>
              ))}
              <Button
                type="text"
                className={classes.projectButton}
                icon={<Plus size={16} />}
                onClick={() => history.push('/projects')}
              >
                Add Project
              </Button>
            </Space>
          </div>
        </div>

        <div className={classes.sidebarFooter}>
          <Button
            type="text"
            icon={<Settings size={16} />}
            className={classes.navButton}
          >
            Settings
          </Button>
        </div>
      </Sider>

      {/* Main Content */}
      <Layout className={classes.mainLayout}>
        {/* Timer Header */}
        <div className={classes.timerHeader}>
          <div className={classes.timerHeaderInner}>
            <div className={classes.timerInputContainer}>
              <Input
                placeholder="What are you working on?"
                className={classes.timerInput}
                value={currentTaskTitle}
                onChange={(e) => setCurrentTaskTitle(e.target.value)}
                onPressEnter={handleStartStop}
                disabled={!!activeTask}
              />
              <div className={classes.timerControlsDesktop}>
                <Button
                  type="text"
                  size="small"
                  className={`${classes.projectSelectorButton} ${selectedProject ? '' : classes.projectSelectorButtonMuted}`}
                  onClick={handleProjectSelect}
                >
                  {selectedProject ? (
                    <>
                      <span
                        className={classes.projectDot}
                        style={{ backgroundColor: selectedProject.color || '#1890ff' }}
                      />
                      {selectedProject.title}
                    </>
                  ) : (
                    <>
                      <Folder size={16} />
                      Project
                    </>
                  )}
                </Button>
                <Divider type="vertical" className={classes.verticalDivider} />
                <div className={classes.timerDisplay}>
                  {formatTime(timerSeconds)}
                </div>
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={activeTask ? <Pause size={16} /> : <Play size={16} className={classes.playIconOffset} />}
                  className={classes.playButton}
                  onClick={handleStartStop}
                  danger={!!activeTask}
                />
              </div>
            </div>

            {/* Mobile Timer Controls */}
            <div className={classes.timerControlsMobile}>
              <div className={classes.timerDisplayMobile}>
                {formatTime(timerSeconds)}
              </div>
              <Button
                type="primary"
                shape="circle"
                size="large"
                icon={activeTask ? <Pause size={20} /> : <Play size={20} className={classes.playIconOffset} />}
                className={classes.playButtonMobile}
                onClick={handleStartStop}
                danger={!!activeTask}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <Content className={classes.content}>
          <div className={classes.contentInner}>
            {/* Stats Cards */}
            <div className={classes.statsGrid}>
              <Card className={classes.statCard}>
                <div className={classes.statLabel}>Total Time Today</div>
                <div className={classes.statValue}>{totalTimeToday}</div>
              </Card>
              <Card className={classes.statCard}>
                <div className={classes.statLabel}>Billable Amount</div>
                <div className={classes.statValue}>$0.00</div>
              </Card>
              <Card className={classes.statCard}>
                <div className={classes.statLabel}>Active Projects</div>
                <div className={classes.statValue}>{activeProjectsCount}</div>
              </Card>
              <Card className={classes.statCard}>
                <div className={classes.statLabel}>Most Tracked</div>
                <div className={classes.statValueSmall}>
                  {mostTrackedProject?.title || 'None'}
                </div>
              </Card>
            </div>

            {/* Time Entries */}
            <div className={classes.entriesSection}>
              <div className={classes.entriesHeader}>
                <h2 className={classes.entriesTitle}>Today</h2>
                <div className={classes.entriesTotal}>Total: {totalTimeToday}</div>
              </div>

              <Card className={classes.entriesCard}>
                {timeItems.length > 0 ? (
                  timeItems.map((item, index) => {
                    const project = projectStore.get(item.task.projectId);
                    const duration = msToTime(item.time.end
                      ? item.time.end.getTime() - item.time.start.getTime()
                      : Date.now() - item.time.start.getTime(), false);

                    const entryMenu = (
                      <Menu>
                        <Menu.Item key="restart" icon={<Play size={14} />} onClick={() => handleEntryMenuClick(item, 'restart')}>
                          Restart Timer
                        </Menu.Item>
                        <Menu.Item key="edit" onClick={() => handleEntryMenuClick(item, 'edit')}>
                          Edit
                        </Menu.Item>
                        <Menu.Divider />
                        <Menu.Item key="delete" danger onClick={() => handleEntryMenuClick(item, 'delete')}>
                          Delete
                        </Menu.Item>
                      </Menu>
                    );

                    return (
                      <div key={`${item.task.key}-${item.index}`}>
                        <div className={classes.entryRow}>
                          <div className={classes.entryContent}>
                            <div className={classes.entryTitle}>{item.task.title}</div>
                            {/* Mobile project badge */}
                            {project && (
                              <div className={classes.entryProjectMobile}>
                                <span
                                  className={classes.projectDot}
                                  style={{ backgroundColor: project.color || '#1890ff' }}
                                />
                                {project.title}
                              </div>
                            )}
                          </div>
                          {/* Desktop project display */}
                          <div className={classes.entryProjectDesktop}>
                            {project ? (
                              <span className={classes.entryProjectBadge}>
                                <span
                                  className={classes.projectDot}
                                  style={{ backgroundColor: project.color || '#1890ff' }}
                                />
                                {project.title}
                              </span>
                            ) : (
                              <span className={classes.entryProjectNoProject}>No Project</span>
                            )}
                          </div>
                          <div className={classes.entryTime}>
                            <div className={classes.entryTimeInfo}>
                              <div className={classes.entryTimeRange}>
                                {item.time.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {item.time.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) || 'Running...'}
                              </div>
                              <div className={classes.entryDuration}>{duration}</div>
                            </div>
                            {/* Hover actions */}
                            <div className={classes.entryActions}>
                              <Button
                                type="text"
                                size="small"
                                icon={<Play size={12} />}
                                className={classes.entryActionButton}
                                onClick={() => handleRestartTimer(item.task)}
                                title="Restart timer"
                              />
                              <Dropdown overlay={entryMenu} trigger={['click']}>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<MoreHorizontal size={12} />}
                                  className={classes.entryActionButton}
                                  title="More options"
                                />
                              </Dropdown>
                            </div>
                          </div>
                        </div>
                        {index < timeItems.length - 1 && <Divider className={classes.entryDivider} />}
                      </div>
                    );
                  })
                ) : (
                  <div className={classes.emptyState}>No time entries for today</div>
                )}
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
      <DrawerTask
        task={selectedTask}
        visible={drawerVisible}
        onClose={handleCloseDrawer}
      />
    </Layout>
  );
});

export default TimerDashboard;

const useStyles = createUseStyles({
  root: {
    height: '100vh',
    overflow: 'hidden',
  },
  sider: {
    backgroundColor: '#fafafa',
    borderRight: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    borderBottom: '1px solid #e8e8e8',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
    fontSize: 18,
  },
  logoIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1890ff',
    color: '#fff',
  },
  logoIcon: {
    width: 20,
    height: 20,
  },
  logoText: {
    color: '#262626',
  },
  sidebarContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 8px',
  },
  nav: {
    width: '100%',
  },
  navButton: {
    width: '100%',
    textAlign: 'left',
    height: 36,
    padding: '0 12px',
    justifyContent: 'flex-start',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  navButtonActive: {
    backgroundColor: '#f0f0f0',
    color: '#1890ff',
  },
  divider: {
    margin: '16px 8px',
  },
  projectsSection: {
    padding: '0 16px',
  },
  projectsTitle: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#8c8c8c',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  projectsList: {
    width: '100%',
  },
  projectButton: {
    width: '100%',
    textAlign: 'left',
    height: 32,
    fontSize: 14,
    padding: '0 12px',
  },
  projectDot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginRight: 8,
  },
  sidebarFooter: {
    borderTop: '1px solid #e8e8e8',
    padding: '16px 8px',
  },
  mainLayout: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  timerHeader: {
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: 'rgba(250, 250, 250, 0.8)',
    padding: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  timerHeaderInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    '@media (min-width: 640px)': {
      flexDirection: 'row',
      alignItems: 'center',
    },
  },
  timerInputContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 16px',
    backgroundColor: '#fff',
    borderRadius: 8,
    border: '1px solid #d9d9d9',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  timerInput: {
    flex: 1,
    border: 'none',
    fontSize: 16,
    boxShadow: 'none',
    '&:focus': {
      boxShadow: 'none',
    },
  },
  timerControlsDesktop: {
    display: 'none',
    alignItems: 'center',
    gap: 12,
    '@media (min-width: 640px)': {
      display: 'flex',
    },
  },
  timerControlsMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    '@media (min-width: 640px)': {
      display: 'none',
    },
  },
  projectSelectorButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  projectSelectorButtonMuted: {
    color: '#8c8c8c',
  },
  timerDisplayMobile: {
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 500,
  },
  playButtonMobile: {
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalDivider: {
    height: 24,
    margin: 0,
  },
  timerDisplay: {
    fontFamily: 'monospace',
    fontSize: 20,
    fontWeight: 500,
    minWidth: 96,
    textAlign: 'center',
  },
  playButton: {
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: '2px', // ml-0.5 equivalent
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#fff',
  },
  contentInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    padding: 16,
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  statLabel: {
    fontSize: 13,
    color: '#8c8c8c',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 600,
    color: '#262626',
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: 500,
    color: '#262626',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  entriesSection: {
    marginTop: 32,
  },
  entriesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: 0,
  },
  entriesTotal: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  entriesCard: {
    borderRadius: 8,
    border: '1px solid #e8e8e8',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    padding: 0,
  },
  entryRow: {
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    gap: 12,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#fafafa',
    },
    '@media (min-width: 640px)': {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
  },
  entryContent: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 4,
  },
  entryProjectMobile: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: '#8c8c8c',
    marginTop: 4,
    '@media (min-width: 640px)': {
      display: 'none',
    },
  },
  entryProjectDesktop: {
    display: 'none',
    flex: 1,
    '@media (min-width: 640px)': {
      display: 'block',
    },
  },
  entryProjectBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    color: '#1890ff',
  },
  entryProjectNoProject: {
    fontSize: 14,
    color: '#8c8c8c',
  },
  entryTime: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    '@media (min-width: 640px)': {
      justifyContent: 'flex-end',
    },
  },
  entryTimeInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  entryTimeRange: {
    fontSize: 13,
    color: '#8c8c8c',
    whiteSpace: 'nowrap',
  },
  entryDuration: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 500,
    minWidth: 80,
    textAlign: 'right',
  },
  entryDivider: {
    margin: 0,
  },
  entryActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    opacity: 0,
    transition: 'opacity 0.2s',
    '.entryRow:hover &': {
      opacity: 1,
    },
  },
  entryActionButton: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 48,
    textAlign: 'center',
    color: '#8c8c8c',
  },
});

