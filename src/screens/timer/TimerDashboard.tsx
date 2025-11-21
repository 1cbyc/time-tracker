import React, { useMemo, useState, useCallback } from 'react';
import { Layout, Input, Button, Card, Space, Divider } from 'antd';
import { observer } from 'mobx-react';
import { createUseStyles } from 'react-jss';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FolderOutlined,
  BarChartOutlined,
  TagOutlined,
  SettingOutlined,
  PlusOutlined,
  MoreOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu } from 'antd';
import { useHistory } from 'react-router-dom';

import rootStore from '../../modules/RootStore';
import TaskModel from '../../modules/tasks/models/TaskModel';
import { getTasksWithTotalTimeForDay, getTimeItems } from '../../helpers/TaskHelper';
import { msToTime } from '../../helpers/DateTime';
import * as TaskHooks from '../../hooks/TaskHooks';
import ProjectModel from '../../modules/projects/models/ProjectModel';
import { v4 as uuid } from 'uuid';

const { Sider, Content } = Layout;
const { tasksStore, projectStore } = rootStore;

const TimerDashboard: React.FC = observer(() => {
  const classes = useStyles();
  const history = useHistory();
  const [currentTaskTitle, setCurrentTaskTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectModel | null>(null);
  const [activeNavItem, setActiveNavItem] = useState('timer');

  const today = useMemo(() => new Date(), []);
  const todayTasks = useMemo(() => tasksStore.getTasksByDate(today), [today]);
  const timeItems = useMemo(() => getTimeItems(todayTasks, today), [todayTasks, today]);
  const activeTask = tasksStore.activeTask;
  const duration = TaskHooks.useTaskDuration(activeTask);

  // Timer display state - updates every second when timer is running
  const [timerSeconds, setTimerSeconds] = useState(0);

  React.useEffect(() => {
    if (activeTask?.active) {
      const interval = setInterval(() => {
        const durationMs = activeTask.duration;
        setTimerSeconds(Math.floor(durationMs / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimerSeconds(0);
    }
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
        details: '',
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

  const handleEntryMenuClick = useCallback((task: TaskModel, action: string) => {
    if (action === 'restart') {
      handleRestartTimer(task);
    } else if (action === 'edit') {
      // TODO: Open task edit drawer
    } else if (action === 'delete') {
      // TODO: Delete time entry
    }
  }, [handleRestartTimer]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getElapsedSeconds = () => {
    if (!activeTask) return 0;
    const durationMs = activeTask.duration;
    return Math.floor(durationMs / 1000);
  };


  return (
    <Layout className={classes.root}>
      {/* Sidebar */}
      <Sider width={256} className={classes.sider}>
        <div className={classes.sidebarHeader}>
          <div className={classes.logo}>
            <div className={classes.logoIconContainer}>
              <ClockCircleOutlined className={classes.logoIcon} />
            </div>
            <span className={classes.logoText}>TimeTracker</span>
          </div>
        </div>

        <div className={classes.sidebarContent}>
          <Space direction="vertical" size={4} className={classes.nav}>
            <Button
              type="text"
              icon={<ClockCircleOutlined />}
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
              icon={<BarChartOutlined />}
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
              icon={<FolderOutlined />}
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
              icon={<TagOutlined />}
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
                icon={<PlusOutlined />}
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
            icon={<SettingOutlined />}
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
                      <FolderOutlined />
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
                  icon={activeTask ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
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
                icon={activeTask ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
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

                    return (
                      <div key={`${item.task.key}-${item.index}`}>
                        <div className={classes.entryRow}>
                          <div className={classes.entryContent}>
                            <div className={classes.entryTitle}>{item.task.title}</div>
                            {project && (
                              <div className={classes.entryProject}>
                                <span
                                  className={classes.projectDot}
                                  style={{ backgroundColor: project.color || '#1890ff' }}
                                />
                                {project.title}
                              </div>
                            )}
                          </div>
                          <div className={classes.entryTime}>
                            <div className={classes.entryTimeRange}>
                              {item.time.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' - '}
                              {item.time.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'}) || 'Running...'}
                            </div>
                            <div className={classes.entryDuration}>{duration}</div>
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
  logoIcon: {
    fontSize: 20,
    color: '#1890ff',
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
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
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
    backgroundColor: '#fafafa',
    padding: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  timerInputContainer: {
    maxWidth: 1200,
    margin: '0 auto',
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
  timerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
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
    alignItems: 'center',
    padding: 16,
    gap: 16,
    '&:hover': {
      backgroundColor: '#fafafa',
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
  entryProject: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: '#8c8c8c',
    marginTop: 4,
  },
  entryTime: {
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
  emptyState: {
    padding: 48,
    textAlign: 'center',
    color: '#8c8c8c',
  },
});

