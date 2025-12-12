import React, { useState, useEffect } from 'react';
import { WSTG_CATEGORIES } from './constants';
import Sidebar from './components/Sidebar';
import TestDetail from './components/TestDetail';
import ProjectManager from './components/ProjectManager';
import { WSTGTest, TestProgress, TestStatus, Project, ProjectTestCase, PayloadItem } from './types';
import { Menu, X } from 'lucide-react';

// Utility to generate IDs that works in non-secure contexts (http)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<'guide' | 'projects'>('guide');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Guide State
  const [selectedTest, setSelectedTest] = useState<WSTGTest | null>(null);
  const [progress, setProgress] = useState<TestProgress>({});

  // Project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Load Initial Data
  useEffect(() => {
    // Load Progress
    const savedProgress = localStorage.getItem('wstg_progress');
    if (savedProgress) {
      try { setProgress(JSON.parse(savedProgress)); } catch (e) { console.error(e); }
    }
    
    // Load Projects
    const savedProjects = localStorage.getItem('wstg_projects');
    if (savedProjects) {
      try { setProjects(JSON.parse(savedProjects)); } catch (e) { console.error(e); }
    }

    // Default Selection
    if (WSTG_CATEGORIES.length > 0 && WSTG_CATEGORIES[0].tests.length > 0) {
        setSelectedTest(WSTG_CATEGORIES[0].tests[0]);
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wstg_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('wstg_projects', JSON.stringify(projects));
  }, [projects]);

  // --- Handlers: Guide ---
  // Updated signature to accept PayloadItem[] instead of notes string
  const handleUpdateStatus = (testId: string, status: TestStatus, userPayloads: PayloadItem[]) => {
    setProgress(prev => ({
      ...prev,
      [testId]: { status, userPayloads }
    }));
  };

  const handleSelectTest = (test: WSTGTest) => {
    setSelectedTest(test);
    setIsMobileMenuOpen(false);
  };

  // --- Handlers: Projects ---
  const handleCreateProject = (name: string, description: string) => {
    const newProject: Project = {
      id: generateId(),
      name,
      description,
      createdAt: Date.now(),
      testCases: []
    };
    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const handleEditProject = (id: string, name: string, description: string) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name, description } : p));
  };

  const handleDeleteProject = (id: string) => {
    // UI handled confirmation, just delete here
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const handleDuplicateProject = (projectId: string) => {
    const projectToClone = projects.find(p => p.id === projectId);
    if (!projectToClone) return;

    const newProjectId = generateId();
    const clonedProject: Project = {
      ...projectToClone,
      id: newProjectId,
      name: `${projectToClone.name} (Copy)`,
      createdAt: Date.now(),
      testCases: projectToClone.testCases.map(tc => ({
        ...tc,
        id: generateId(),
        projectId: newProjectId,
        createdAt: Date.now()
      }))
    };
    
    setProjects(prev => [clonedProject, ...prev]);
    setSelectedProjectId(newProjectId);
  };

  const handleImportProjects = (importedProjects: Project[]) => {
    const validProjects = importedProjects.filter(p => p.id && p.name && Array.isArray(p.testCases));
    setProjects(prev => {
        const currentIds = new Set(prev.map(p => p.id));
        const newProjects = validProjects.filter(p => !currentIds.has(p.id));
        return [...newProjects, ...prev];
    });
    alert(`Đã nhập thành công ${validProjects.length} dự án.`);
  };

  const handleAddTestCase = (projectId: string, testCaseData: Omit<ProjectTestCase, 'id' | 'projectId' | 'createdAt'>) => {
    const newCase: ProjectTestCase = {
      ...testCaseData,
      id: generateId(),
      projectId,
      createdAt: Date.now()
    };
    
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return { ...p, testCases: [newCase, ...p.testCases] };
    }));
  };

  const handleDuplicateTestCase = (projectId: string, testCaseId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      
      const original = p.testCases.find(tc => tc.id === testCaseId);
      if (!original) return p;

      const copy: ProjectTestCase = {
        ...original,
        id: generateId(),
        title: `${original.title} (Copy)`,
        createdAt: Date.now()
      };

      return { ...p, testCases: [copy, ...p.testCases] };
    }));
  };

  const handleUpdateTestCase = (projectId: string, testCaseId: string, updates: Partial<ProjectTestCase>) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        testCases: p.testCases.map(tc => tc.id === testCaseId ? { ...tc, ...updates } : tc)
      };
    }));
  };

  const handleDeleteTestCase = (projectId: string, testCaseId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        testCases: p.testCases.filter(tc => tc.id !== testCaseId)
      };
    }));
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-slate-900 text-white p-2 rounded-full shadow-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Wrapper */}
      <div className={`
        fixed inset-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 md:w-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          mode={viewMode}
          setMode={setViewMode}
          // Guide props
          categories={WSTG_CATEGORIES} 
          selectedTestId={selectedTest?.id || null}
          onSelectTest={handleSelectTest}
          progress={progress}
          // Project props
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => {
            setSelectedProjectId(id);
            setIsMobileMenuOpen(false);
          }}
          onCreateNewProject={() => setSelectedProjectId(null)} 
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        {viewMode === 'guide' ? (
          selectedTest ? (
            <TestDetail 
              test={selectedTest} 
              progress={progress}
              onUpdateStatus={handleUpdateStatus}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <p>Chọn một bài kiểm tra để bắt đầu.</p>
            </div>
          )
        ) : (
          <ProjectManager 
            projects={projects}
            selectedProjectId={selectedProjectId}
            onCreateProject={handleCreateProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
            onDuplicateProject={handleDuplicateProject}
            onImportProjects={handleImportProjects}
            onAddTestCase={handleAddTestCase}
            onDuplicateTestCase={handleDuplicateTestCase}
            onUpdateTestCase={handleUpdateTestCase}
            onDeleteTestCase={handleDeleteTestCase}
          />
        )}
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;