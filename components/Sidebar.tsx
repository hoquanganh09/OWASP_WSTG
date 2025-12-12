import React from 'react';
import { WSTGCategory, WSTGTest, TestProgress, TestStatus, Project } from '../types';
import { Shield, CheckCircle, Circle, Folder, Book, Briefcase, Plus, Ban } from 'lucide-react';

interface SidebarProps {
  mode: 'guide' | 'projects';
  setMode: (mode: 'guide' | 'projects') => void;
  // Guide props
  categories: WSTGCategory[];
  selectedTestId: string | null;
  onSelectTest: (test: WSTGTest) => void;
  progress: TestProgress;
  // Project props
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateNewProject: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  mode, setMode,
  categories, selectedTestId, onSelectTest, progress,
  projects, selectedProjectId, onSelectProject, onCreateNewProject
}) => {
  
  const getStatusIcon = (testId: string) => {
    const status = progress[testId]?.status || TestStatus.NOT_STARTED;
    switch (status) {
      case TestStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case TestStatus.IN_PROGRESS:
        return <Circle className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />;
      case TestStatus.NOT_BUG:
        return <Ban className="w-4 h-4 text-slate-500" />;
      default:
        return <Circle className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="w-full md:w-80 bg-slate-900 h-screen overflow-y-auto flex flex-col border-r border-slate-700 shadow-xl">
      {/* App Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3 text-white mb-4">
          <Shield className="w-8 h-8 text-indigo-500" />
          <div>
             <h1 className="text-xl font-bold tracking-tight leading-none">OWASP WSTG</h1>
             <span className="text-[10px] text-slate-500 font-mono">v4.2 Assistant</span>
          </div>
        </div>
        
        {/* Mode Switcher */}
        <div className="flex p-1 bg-slate-800 rounded-lg">
          <button
            onClick={() => setMode('guide')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
              mode === 'guide' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Book size={14} /> Guide
          </button>
          <button
            onClick={() => setMode('projects')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
              mode === 'projects' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase size={14} /> Projects
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6">
        {mode === 'guide' ? (
          // --- GUIDE MODE ---
          categories.map((category) => (
            <div key={category.id}>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">
                {category.name}
              </h2>
              <ul className="space-y-1">
                {category.tests.map((test) => (
                  <li key={test.id}>
                    <button
                      onClick={() => onSelectTest(test)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all flex items-start gap-3 group ${
                        selectedTestId === test.id
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        {getStatusIcon(test.id)}
                      </div>
                      <div>
                        <span className="block font-mono text-xs opacity-70 mb-0.5">{test.id}</span>
                        <span className="leading-tight block">{test.title}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          // --- PROJECTS MODE ---
          <div>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                My Projects
              </h2>
              <button 
                onClick={onCreateNewProject}
                className="text-indigo-400 hover:text-white transition-colors"
                title="Create Project"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {projects.length === 0 ? (
              <div className="px-2 text-sm text-slate-500 italic">
                No projects yet. Click + to create one.
              </div>
            ) : (
              <ul className="space-y-1">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={`w-full text-left px-3 py-3 rounded-md text-sm transition-all flex items-center gap-3 group ${
                        selectedProjectId === project.id
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Folder size={16} className={selectedProjectId === project.id ? 'text-white' : 'text-slate-500'} />
                      <div className="min-w-0">
                        <span className="block font-medium truncate">{project.name}</span>
                        <span className="text-[10px] opacity-60 block">
                           {project.testCases.length} cases
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-800 text-slate-500 text-xs text-center">
        Built with React & Gemini
      </div>
    </div>
  );
};

export default Sidebar;