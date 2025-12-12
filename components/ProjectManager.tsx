
import React, { useState, useMemo, useRef } from 'react';
import { Project, ProjectTestCase, TestStatus } from '../types';
import { WSTG_CATEGORIES } from '../constants';
import { analyzeRequestAndGenerateTests } from '../services/geminiService';
import { Plus, Trash2, ExternalLink, Check, FolderPlus, Download, Edit2, Copy, X, Save, Calculator, AlertTriangle, Eye, FileText, Activity, Share, Search, Database, Upload, FileJson, BarChart2, List, PieChart, Sparkles, Zap, Globe, Filter } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  selectedProjectId: string | null;
  onCreateProject: (name: string, description: string) => void;
  onEditProject: (id: string, name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onImportProjects: (projects: Project[]) => void;
  onAddTestCase: (projectId: string, testCase: Omit<ProjectTestCase, 'id' | 'projectId' | 'createdAt'>) => void;
  onDuplicateTestCase: (projectId: string, testCaseId: string) => void;
  onUpdateTestCase: (projectId: string, testCaseId: string, updates: Partial<ProjectTestCase>) => void;
  onDeleteTestCase: (projectId: string, testCaseId: string) => void;
}

// CVSS Calculator Constants
const CVSS_METRICS = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: { N: 0.85, L: 0.62, H: 0.27 }, // Simplified, depends on Scope
  UI: { N: 0.85, R: 0.62 },
  S: { U: 1.0, C: 1.0 }, // C handles impact multiplier
  C: { N: 0, L: 0.22, H: 0.56 },
  I: { N: 0, L: 0.22, H: 0.56 },
  A: { N: 0, L: 0.22, H: 0.56 },
};

const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  selectedProjectId,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onDuplicateProject,
  onImportProjects,
  onAddTestCase,
  onDuplicateTestCase,
  onUpdateTestCase,
  onDeleteTestCase
}) => {
  // --- Create Project State ---
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Edit Project State ---
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');

  // --- View Mode ---
  const [projectViewMode, setProjectViewMode] = useState<'list' | 'dashboard'>('list');

  // --- Add Test Case State ---
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestWstgId, setNewTestWstgId] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestTarget, setNewTestTarget] = useState('');

  // --- AI Gen State ---
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [rawRequestInput, setRawRequestInput] = useState('');
  const [aiTargetInput, setAiTargetInput] = useState('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // --- Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [targetFilter, setTargetFilter] = useState<string>('ALL');

  // --- Edit Test Case State (Modal) ---
  const [editingTestCase, setEditingTestCase] = useState<ProjectTestCase | null>(null);

  // --- CVSS/Report Modal State ---
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeReportTestCaseId, setActiveReportTestCaseId] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<'details' | 'cvss'>('details');
  
  // CVSS State
  const [cvssMetrics, setCvssMetrics] = useState({
    AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N'
  });
  
  // Report State
  const [reportData, setReportData] = useState({
    vulnDescription: '',
    impact: '',
    poc: '',
    recommendation: '',
    references: ''
  });

  // Flatten WSTG tests
  const allWstgTests = useMemo(() => {
    return WSTG_CATEGORIES.flatMap(c => c.tests);
  }, []);

  const getWstgInfo = (wstgId: string) => allWstgTests.find(t => t.id === wstgId);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // Stats Calculation
  const projectStats = useMemo(() => {
    if (!selectedProject) return null;
    const total = selectedProject.testCases.length;
    const completed = selectedProject.testCases.filter(t => t.status === TestStatus.COMPLETED).length;
    
    // Only count severities for COMPLETED items to be accurate in reporting
    const completedTests = selectedProject.testCases.filter(t => t.status === TestStatus.COMPLETED);
    
    const severityCounts = {
      Critical: completedTests.filter(t => t.severity === 'Critical').length,
      High: completedTests.filter(t => t.severity === 'High').length,
      Medium: completedTests.filter(t => t.severity === 'Medium').length,
      Low: completedTests.filter(t => t.severity === 'Low').length,
      Info: completedTests.filter(t => t.severity === 'Info').length,
    };

    const vulnerabilitiesFound = severityCounts.Critical + severityCounts.High + severityCounts.Medium + severityCounts.Low;

    return { total, completed, severityCounts, vulnerabilitiesFound };
  }, [selectedProject]);

  // Extract unique targets for filter
  const uniqueTargets = useMemo(() => {
    if (!selectedProject) return [];
    const targets = new Set(selectedProject.testCases.map(tc => tc.target).filter(Boolean));
    return Array.from(targets);
  }, [selectedProject]);

  // Filter Logic
  const filteredTestCases = useMemo(() => {
    if (!selectedProject) return [];
    
    return selectedProject.testCases.filter(tc => {
      const matchesSearch = 
        tc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tc.wstgId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tc.target && tc.target.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === 'ALL' || tc.status === statusFilter;
      const matchesTarget = targetFilter === 'ALL' || tc.target === targetFilter;
      
      return matchesSearch && matchesStatus && matchesTarget;
    });
  }, [selectedProject, searchTerm, statusFilter, targetFilter]);

  // Helper to check if test is Recon/Info Gathering
  const isReconTask = (wstgId: string) => {
      return wstgId.startsWith('WSTG-INFO');
  };

  // --- CVSS Calculation Logic (Simplified) ---
  const calculateCVSS = () => {
    // This is a simplified implementation of CVSS 3.1
    // In a real app, use a dedicated library like 'cvss' package for precision
    // Base Score = Roundup(Minimum(Impact + Exploitability, 10))
    
    // Impact Sub Score (ISS) = 1 - [(1-C)*(1-I)*(1-A)]
    const m = cvssMetrics;
    // @ts-ignore
    const iss = 1 - ((1 - CVSS_METRICS.C[m.C]) * (1 - CVSS_METRICS.I[m.I]) * (1 - CVSS_METRICS.A[m.A]));
    
    let impact = 0;
    if (m.S === 'U') {
      impact = 6.42 * iss;
    } else {
      impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
    }
    
    // PR Value adjusts based on Scope
    let prVal = 0.85; // Default N
    if (m.PR === 'L') prVal = m.S === 'U' ? 0.62 : 0.68;
    if (m.PR === 'H') prVal = m.S === 'U' ? 0.27 : 0.50;
    
    // @ts-ignore
    const exploitability = 8.22 * CVSS_METRICS.AV[m.AV] * CVSS_METRICS.AC[m.AC] * prVal * CVSS_METRICS.UI[m.UI];

    let baseScore = 0;
    if (impact <= 0) {
      baseScore = 0;
    } else {
      if (m.S === 'U') {
        baseScore = Math.min(impact + exploitability, 10);
      } else {
        baseScore = Math.min(1.08 * (impact + exploitability), 10);
      }
    }
    
    return Math.ceil(baseScore * 10) / 10;
  };

  const getSeverityFromScore = (score: number): ProjectTestCase['severity'] => {
    if (score === 0) return 'Info';
    if (score < 4.0) return 'Low';
    if (score < 7.0) return 'Medium';
    if (score < 9.0) return 'High';
    return 'Critical';
  };

  // --- Handlers ---

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName, newProjectDesc);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsCreatingProject(false);
  };

  const startEditProject = () => {
    if (!selectedProject) return;
    setEditProjectName(selectedProject.name);
    setEditProjectDesc(selectedProject.description);
    setIsEditingProject(true);
  };

  const saveEditProject = () => {
    if (!selectedProject || !editProjectName.trim()) return;
    onEditProject(selectedProject.id, editProjectName, editProjectDesc);
    setIsEditingProject(false);
  };

  const handleConfirmDeleteProject = () => {
    if (!selectedProject) return;
    if (window.confirm("Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác.")) {
      onDeleteProject(selectedProject.id);
    }
  };

  const handleConfirmDeleteTestCase = (e: React.MouseEvent, testCaseId: string) => {
    e.stopPropagation(); // Prevent bubbling
    if (!selectedProject) return;
    if (window.confirm("Bạn có muốn xóa test case này không?")) {
      onDeleteTestCase(selectedProject.id, testCaseId);
    }
  };

  const handleAddTestCase = () => {
    if (!selectedProjectId || !newTestTitle.trim() || !newTestWstgId) return;
    
    onAddTestCase(selectedProjectId, {
      title: newTestTitle,
      wstgId: newTestWstgId,
      description: newTestDesc,
      status: TestStatus.NOT_STARTED,
      severity: 'Info', // Default, will be updated by CVSS
      notes: '',
      target: newTestTarget
    });

    // Reset form
    setNewTestTitle('');
    setNewTestDesc('');
    setNewTestWstgId('');
    setNewTestTarget('');
    setIsAddingTest(false);
  };

  const handleAiAnalysis = async () => {
    if (!selectedProjectId || !rawRequestInput.trim()) return;
    
    setIsAiAnalyzing(true);
    try {
      const generatedTests = await analyzeRequestAndGenerateTests(rawRequestInput);
      
      // Batch add test cases
      generatedTests.forEach(test => {
        onAddTestCase(selectedProjectId, {
          title: test.title,
          wstgId: test.wstgId,
          description: test.description + `\n\n(Generated from Request Analysis)`,
          status: TestStatus.NOT_STARTED,
          severity: test.severity,
          notes: 'Auto-generated by AI',
          tags: ['AI'],
          // Manual input overrides AI detection, or falls back to AI detection
          target: aiTargetInput.trim() || test.target 
        });
      });

      setIsAiModalOpen(false);
      setRawRequestInput('');
      setAiTargetInput('');
      alert(`Đã tạo thành công ${generatedTests.length} test case từ phân tích AI.`);

    } catch (error) {
      alert("Lỗi khi phân tích request. Vui lòng thử lại.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleStatusChange = (testCase: ProjectTestCase, newStatus: string) => {
    if (!selectedProject) return;

    if (newStatus === TestStatus.COMPLETED) {
      openReportModal(testCase);
    } else {
      // Normal Update
      onUpdateTestCase(selectedProject.id, testCase.id, { status: newStatus as TestStatus });
    }
  };

  const openReportModal = (testCase: ProjectTestCase) => {
    setActiveReportTestCaseId(testCase.id);
    setActiveReportTab('details'); // Default tab
    
    if (testCase.cvssVector) {
        // Here we ideally parse the vector to set metrics state. 
    } else {
       setCvssMetrics({ AV: 'N', AC: 'L', PR: 'N', UI: 'N', S: 'U', C: 'N', I: 'N', A: 'N' });
    }

    setReportData({
        vulnDescription: testCase.vulnDescription || testCase.description || '', 
        impact: testCase.impact || '',
        poc: testCase.poc || '',
        recommendation: testCase.recommendation || '',
        references: testCase.references || ''
    });

    setReportModalOpen(true);
  };

  const handleSaveReport = () => {
    if (!selectedProject || !activeReportTestCaseId) return;
    
    const testCase = selectedProject.testCases.find(tc => tc.id === activeReportTestCaseId);
    const isRecon = testCase ? isReconTask(testCase.wstgId) : false;

    // Only calc CVSS if not recon
    const score = isRecon ? 0 : calculateCVSS();
    const severity = isRecon ? 'Info' : getSeverityFromScore(score);
    const vector = isRecon ? '' : `CVSS:3.1/AV:${cvssMetrics.AV}/AC:${cvssMetrics.AC}/PR:${cvssMetrics.PR}/UI:${cvssMetrics.UI}/S:${cvssMetrics.S}/C:${cvssMetrics.C}/I:${cvssMetrics.I}/A:${cvssMetrics.A}`;

    // Prepare data to save, sanitize irrelevant fields for Recon
    const saveData = {
        ...reportData,
        // Clear these fields for Recon to avoid confusion in future reports/views
        impact: isRecon ? '' : reportData.impact,
        recommendation: isRecon ? '' : reportData.recommendation,
        references: isRecon ? '' : reportData.references
    };

    onUpdateTestCase(selectedProject.id, activeReportTestCaseId, {
      status: TestStatus.COMPLETED,
      cvssScore: score,
      severity: severity,
      cvssVector: vector,
      ...saveData
    });

    setReportModalOpen(false);
    setActiveReportTestCaseId(null);
  };

  const handleViewReport = (testCase: ProjectTestCase) => {
    openReportModal(testCase);
  };

  const handleSaveEditedTestCase = () => {
    if (!selectedProject || !editingTestCase) return;
    onUpdateTestCase(selectedProject.id, editingTestCase.id, {
      title: editingTestCase.title,
      wstgId: editingTestCase.wstgId,
      description: editingTestCase.description,
      target: editingTestCase.target,
      // Status and severity are handled via status flow usually, but we allow edits here
      severity: editingTestCase.severity,
      status: editingTestCase.status
    });
    setEditingTestCase(null);
  };

  const exportToCSV = () => {
    if (!selectedProject) return;
    const BOM = "\uFEFF";
    const headers = ["ID", "Title", "Target", "Tags", "WSTG Ref", "Status", "Severity", "CVSS Score", "CVSS Vector", "Vuln Description/Summary", "Impact", "PoC/Findings", "Recommendation", "References", "Notes"];
    const rows = selectedProject.testCases.map(tc => [
      tc.id,
      `"${tc.title.replace(/"/g, '""')}"`,
      `"${(tc.target || '').replace(/"/g, '""')}"`,
      `"${(tc.tags || []).join(', ')}"`,
      tc.wstgId,
      tc.status,
      tc.severity,
      tc.cvssScore || 0,
      `"${tc.cvssVector || ''}"`,
      `"${(tc.vulnDescription || tc.description || '').replace(/"/g, '""')}"`,
      `"${(tc.impact || '').replace(/"/g, '""')}"`,
      `"${(tc.poc || '').replace(/"/g, '""')}"`,
      `"${(tc.recommendation || '').replace(/"/g, '""')}"`,
      `"${(tc.references || '').replace(/"/g, '""')}"`,
      `"${tc.notes.replace(/"/g, '""')}"`,
    ]);
    
    const csvContent = BOM + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedProject.name.replace(/\s+/g, '_')}_pentest_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAllProjects = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `wstg_projects_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const exportFullHTMLReport = () => {
    if (!selectedProject || !projectStats) return;

    const completedTests = selectedProject.testCases.filter(t => t.status === TestStatus.COMPLETED);
    const date = new Date().toLocaleDateString();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pentest Report - ${selectedProject.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 960px; mx-auto; padding: 40px; background: #f9fafb; }
        .container { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin: 0 auto; }
        h1 { color: #111; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
        h2 { color: #1f2937; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
        h3 { color: #374151; margin-top: 25px; font-size: 1.1em; }
        .meta { color: #6b7280; font-size: 0.9em; margin-bottom: 40px; }
        .summary-box { display: flex; gap: 20px; margin-bottom: 40px; }
        .card { flex: 1; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center; }
        .card strong { display: block; font-size: 2em; color: #4f46e5; }
        .card span { font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; }
        
        /* Severity Colors */
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; text-transform: uppercase; display: inline-block; }
        .Critical { background: #fee2e2; color: #991b1b; }
        .High { background: #ffedd5; color: #9a3412; }
        .Medium { background: #fef3c7; color: #92400e; }
        .Low { background: #dbeafe; color: #1e40af; }
        .Info { background: #f3f4f6; color: #374151; }

        .finding { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fff; }
        .finding-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; }
        .finding-title { font-weight: bold; font-size: 1.1em; color: #111; }
        .wstg-ref { font-family: monospace; background: #eef2ff; color: #4f46e5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; margin-right: 10px; }
        .target-tag { background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-size: 0.8em; padding: 2px 6px; border-radius: 4px; display: inline-flex; align-items: center; margin-right: 8px; }
        
        pre { background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 0.9em; }
        .section-label { font-weight: bold; color: #4b5563; font-size: 0.85em; text-transform: uppercase; margin-top: 15px; display: block; }
        
        .footer { text-align: center; margin-top: 50px; color: #9ca3af; font-size: 0.8em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Báo cáo Kiểm thử Bảo mật</h1>
        <div class="meta">
            <p><strong>Dự án:</strong> ${selectedProject.name}</p>
            <p><strong>Ngày báo cáo:</strong> ${date}</p>
            <p><strong>Mô tả:</strong> ${selectedProject.description}</p>
        </div>

        <h2>Tóm tắt Quản trị (Executive Summary)</h2>
        <div class="summary-box">
            <div class="card"><strong>${projectStats.severityCounts.Critical}</strong><span>Critical</span></div>
            <div class="card"><strong>${projectStats.severityCounts.High}</strong><span>High</span></div>
            <div class="card"><strong>${projectStats.severityCounts.Medium}</strong><span>Medium</span></div>
            <div class="card"><strong>${projectStats.severityCounts.Low}</strong><span>Low</span></div>
        </div>

        <h2>Chi tiết Lỗ hổng (Findings)</h2>
        ${completedTests.length === 0 ? '<p>Chưa có lỗ hổng nào được ghi nhận.</p>' : ''}
        
        ${completedTests.map(t => {
            const isRecon = t.wstgId.startsWith('WSTG-INFO');
            return `
            <div class="finding">
                <div class="finding-header">
                    <div>
                        <span class="wstg-ref">${t.wstgId}</span>
                        ${t.target ? `<span class="target-tag">${t.target}</span>` : ''}
                        <span class="finding-title">${t.title}</span>
                        ${t.tags && t.tags.includes('AI') ? '<span style="background:#f3e8ff; color:#6b21a8; font-size:0.7em; padding:2px 5px; border-radius:4px; margin-left:5px;">AI</span>' : ''}
                    </div>
                    <span class="badge ${t.severity}">${t.severity} ${t.cvssScore && !isRecon ? `(${t.cvssScore})` : ''}</span>
                </div>
                
                <span class="section-label">${isRecon ? 'Tổng quan / Phân tích (Analysis)' : 'Mô tả / Tổng quan'}:</span>
                <p>${t.vulnDescription ? t.vulnDescription.replace(/\n/g, '<br>') : 'N/A'}</p>
                
                ${!isRecon && t.impact ? `
                <span class="section-label">Ảnh hưởng (Impact):</span>
                <p>${t.impact.replace(/\n/g, '<br>')}</p>
                ` : ''}
                
                ${t.poc ? `
                <span class="section-label">${isRecon ? 'Dữ liệu thu thập được (Findings)' : 'Bằng chứng / Dữ liệu (PoC)'}:</span>
                <pre>${t.poc}</pre>
                ` : ''}
                
                ${!isRecon && t.recommendation ? `
                <span class="section-label">Khuyến nghị:</span>
                <p>${t.recommendation.replace(/\n/g, '<br>')}</p>
                ` : ''}

                ${!isRecon && t.cvssVector ? `
                <span class="section-label">CVSS Vector:</span>
                <p style="font-family:monospace; font-size:0.9em;">${t.cvssVector}</p>
                ` : ''}
            </div>
        `;
        }).join('')}
        
        <div class="footer">
            Generated by OWASP WSTG Assistant
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedProject.name.replace(/\s+/g, '_')}_Full_Report.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
            onImportProjects(json);
        } else {
            alert("File JSON không hợp lệ. Vui lòng chọn file backup từ ứng dụng này.");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi khi đọc file. File có thể bị hỏng.");
      }
    };
    reader.readAsText(file);
    // Reset inputs
    e.target.value = '';
  };

  const exportSingleReportMarkdown = () => {
    if (!selectedProject || !activeReportTestCaseId) return;
    const tc = selectedProject.testCases.find(t => t.id === activeReportTestCaseId);
    if (!tc) return;
    
    const isRecon = isReconTask(tc.wstgId);
    let content = '';

    if (isRecon) {
        content = `
# Báo cáo Thu thập Thông tin: ${tc.title}

**Dự án:** ${selectedProject.name}
**Chức năng/Target:** ${tc.target || 'N/A'}
**Ngày:** ${new Date().toLocaleDateString()}
**Mã tham chiếu:** ${tc.wstgId}

---

## 1. Tổng quan & Phân tích (Summary)
${reportData.vulnDescription || 'N/A'}

## 2. Dữ liệu thu thập được (Findings)
\`\`\`
${reportData.poc || 'N/A'}
\`\`\`
        `.trim();
    } else {
        const score = calculateCVSS();
        const severity = getSeverityFromScore(score);
        const vector = `CVSS:3.1/AV:${cvssMetrics.AV}/AC:${cvssMetrics.AC}/PR:${cvssMetrics.PR}/UI:${cvssMetrics.UI}/S:${cvssMetrics.S}/C:${cvssMetrics.C}/I:${cvssMetrics.I}/A:${cvssMetrics.A}`;

        content = `
# Báo cáo Lỗ hổng: ${tc.title}

**Dự án:** ${selectedProject.name}
**Chức năng/Target:** ${tc.target || 'N/A'}
**Ngày:** ${new Date().toLocaleDateString()}
**Mã tham chiếu:** ${tc.wstgId}
**Mức độ nghiêm trọng:** ${severity} (CVSS: ${score})
**Vector:** \`${vector}\`

---

## 1. Mô tả (Description)
${reportData.vulnDescription || 'N/A'}

## 2. Ảnh hưởng (Impact)
${reportData.impact || 'N/A'}

## 3. Bằng chứng (Proof of Concept)
\`\`\`
${reportData.poc || 'N/A'}
\`\`\`

## 4. Khuyến nghị (Recommendation)
${reportData.recommendation || 'N/A'}

## 5. Tham khảo (References)
${reportData.references || 'N/A'}
        `.trim();
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${tc.title.replace(/\s+/g, '_')}_report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Resolve active test case for rendering
  const activeTestCase = selectedProject && activeReportTestCaseId 
    ? selectedProject.testCases.find(t => t.id === activeReportTestCaseId) 
    : null;
    
  const isActiveTestRecon = activeTestCase ? isReconTask(activeTestCase.wstgId) : false;

  // --- Render: No Project Selected (Create Screen) ---
  if (!selectedProject) {
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-slate-50 p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderPlus size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Quản lý Dự án Pentest</h2>
          <p className="text-slate-500 mb-8">Tạo dự án để quản lý các test case cụ thể và ánh xạ chúng với chuẩn OWASP WSTG.</p>
          
          {!isCreatingProject ? (
            <div className="space-y-3">
                <button 
                  onClick={() => setIsCreatingProject(true)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Tạo Dự án Mới
                </button>
                <div className="flex gap-2">
                    <button 
                       onClick={exportAllProjects}
                       className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                       <FileJson size={18} /> Backup Dữ liệu (JSON)
                    </button>
                    <button 
                       onClick={handleImportClick}
                       className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                       <Upload size={18} /> Khôi phục (JSON)
                    </button>
                    <input 
                       type="file" 
                       accept=".json" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleFileChange}
                    />
                </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Dự án</label>
                <input 
                  autoFocus
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  placeholder="Ví dụ: HRM System, E-Banking App..."
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả</label>
                <textarea 
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-20 placeholder:text-slate-400"
                  placeholder="Mô tả phạm vi, môi trường test..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCreateProject}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Tạo ngay
                </button>
                <button 
                  onClick={() => setIsCreatingProject(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Render: Project Details ---
  return (
    <div className="flex-1 h-screen overflow-y-auto bg-slate-50 flex flex-col relative">
      
      {/* Project Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 uppercase tracking-wide">Project</span>
              <span className="text-xs text-slate-400">Created {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
            </div>
            
            {isEditingProject ? (
              <div className="mt-2 space-y-2 max-w-xl">
                 <input 
                    className="w-full text-lg font-bold bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editProjectName}
                    onChange={e => setEditProjectName(e.target.value)}
                 />
                 <textarea 
                    className="w-full text-sm bg-white border border-slate-300 rounded px-2 py-1 text-slate-900 resize-none h-16 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={editProjectDesc}
                    onChange={e => setEditProjectDesc(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <button onClick={saveEditProject} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1 hover:bg-green-700">
                     <Save size={12} /> Lưu
                   </button>
                   <button onClick={() => setIsEditingProject(false)} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300">
                     Hủy
                   </button>
                 </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 group">
                   <h2 className="text-2xl font-bold text-slate-900">{selectedProject.name}</h2>
                   <button 
                    onClick={startEditProject} 
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Chỉnh sửa thông tin dự án"
                   >
                     <Edit2 size={16} />
                   </button>
                </div>
                <p className="text-slate-500 text-sm mt-1">{selectedProject.description || "Không có mô tả"}</p>
                
                {/* View Switcher Tabs */}
                <div className="flex gap-6 mt-6">
                    <button
                        onClick={() => setProjectViewMode('list')}
                        className={`pb-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        projectViewMode === 'list' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <List size={16} /> Danh sách ({projectStats?.total || 0})
                    </button>
                    <button
                        onClick={() => setProjectViewMode('dashboard')}
                        className={`pb-2 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                        projectViewMode === 'dashboard' 
                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <PieChart size={16} /> Dashboard
                    </button>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button 
              onClick={exportFullHTMLReport}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium transition-colors shadow-sm"
              title="Xuất Báo cáo HTML Đầy đủ"
            >
              <FileText size={18} /> <span className="hidden sm:inline">Xuất Báo Cáo (HTML)</span>
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              title="Xuất Excel (CSV)"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={() => onDuplicateProject(selectedProject.id)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              title="Nhân bản Dự án"
            >
              <Copy size={18} />
            </button>
            <button 
              onClick={handleConfirmDeleteProject}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
              title="Xóa dự án"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Dashboard or List */}
      {projectViewMode === 'dashboard' && projectStats ? (
          <div className="p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                 <PieChart size={20} className="text-indigo-500" />
                 Tổng quan Dự án
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Tổng số Test Cases</span>
                      <div className="text-3xl font-bold text-slate-900">{projectStats.total}</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Đã hoàn thành</span>
                      <div className="text-3xl font-bold text-green-600">{projectStats.completed}</div>
                      <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full" style={{ width: `${projectStats.total ? (projectStats.completed / projectStats.total) * 100 : 0}%` }}></div>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Lỗ hổng (Vulns)</span>
                      <div className="text-3xl font-bold text-red-600">{projectStats.vulnerabilitiesFound}</div>
                      <span className="text-xs text-slate-400">Không bao gồm mức Info</span>
                  </div>
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-2">Tiến độ</span>
                      <div className="text-3xl font-bold text-indigo-600">
                        {projectStats.total ? Math.round((projectStats.completed / projectStats.total) * 100) : 0}%
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                          <BarChart2 size={18} /> Phân bố Mức độ Nghiêm trọng
                      </h4>
                      <div className="space-y-4">
                          {[
                              { label: 'Critical', count: projectStats.severityCounts.Critical, color: 'bg-red-600', bg: 'bg-red-50' },
                              { label: 'High', count: projectStats.severityCounts.High, color: 'bg-orange-500', bg: 'bg-orange-50' },
                              { label: 'Medium', count: projectStats.severityCounts.Medium, color: 'bg-yellow-500', bg: 'bg-yellow-50' },
                              { label: 'Low', count: projectStats.severityCounts.Low, color: 'bg-blue-500', bg: 'bg-blue-50' },
                              { label: 'Info', count: projectStats.severityCounts.Info, color: 'bg-slate-400', bg: 'bg-slate-50' },
                          ].map(item => (
                              <div key={item.label}>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-medium text-slate-700">{item.label}</span>
                                      <span className="font-bold text-slate-900">{item.count}</span>
                                  </div>
                                  <div className={`w-full h-2.5 rounded-full ${item.bg}`}>
                                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${projectStats.vulnerabilitiesFound + projectStats.severityCounts.Info > 0 ? (item.count / (projectStats.vulnerabilitiesFound + projectStats.severityCounts.Info)) * 100 : 0}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-center items-center text-center">
                      <FileText size={48} className="text-indigo-400 mb-4" />
                      <h4 className="font-bold text-indigo-900 text-lg mb-2">Sẵn sàng báo cáo?</h4>
                      <p className="text-indigo-700 text-sm mb-6 max-w-xs">
                          Xuất toàn bộ kết quả pentest ra file HTML chuyên nghiệp để gửi cho khách hàng hoặc đội ngũ phát triển.
                      </p>
                      <button 
                          onClick={exportFullHTMLReport}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all"
                      >
                          Xuất Báo Cáo Ngay
                      </button>
                  </div>
              </div>
          </div>
      ) : (
      /* Test Cases List View */
      <div className="p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Check size={20} className="text-indigo-500" />
            Danh sách Test Cases
            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{filteredTestCases.length}</span>
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-48"
                 />
              </div>

              {/* Target/Function Filter */}
              <div className="relative">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                     <Filter size={16} />
                 </div>
                 <select 
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[180px]"
                 >
                    <option value="ALL">Tất cả chức năng</option>
                    {uniqueTargets.map((target, idx) => (
                        <option key={idx} value={target}>{target}</option>
                    ))}
                 </select>
              </div>

              <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value={TestStatus.NOT_STARTED}>Not Started</option>
                  <option value={TestStatus.IN_PROGRESS}>In Progress</option>
                  <option value={TestStatus.COMPLETED}>Completed</option>
                  <option value={TestStatus.NOT_BUG}>Not Bug</option>
              </select>
              
              <button 
                onClick={() => {
                  setIsAiModalOpen(true);
                  setAiTargetInput('');
                  setRawRequestInput('');
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Sparkles size={16} /> AI Scan
              </button>

              <button 
                onClick={() => setIsAddingTest(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Plus size={16} /> Thêm Mới
              </button>
          </div>
        </div>

        {/* AI Analysis Modal */}
        {isAiModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !isAiAnalyzing && setIsAiModalOpen(false)}>
             <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-purple-50 rounded-t-xl">
                 <div className="flex items-center gap-2 text-purple-700">
                    <Sparkles size={20} />
                    <h3 className="font-bold text-lg">AI Request Analysis</h3>
                 </div>
                 {!isAiAnalyzing && (
                    <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={24} />
                    </button>
                 )}
               </div>
               
               <div className="p-6">
                 {isAiAnalyzing ? (
                   <div className="py-12 flex flex-col items-center text-center">
                     <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                     <h4 className="font-bold text-slate-800">Đang phân tích Request...</h4>
                     <p className="text-slate-500 text-sm mt-1">AI đang tìm kiếm các điểm yếu tiềm tàng và tạo test case.</p>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Chức năng / Link (Target)</label>
                       <input 
                          className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-4 placeholder:text-slate-400"
                          placeholder="Ví dụ: /api/login (Nếu để trống, AI sẽ tự trích xuất từ Request)"
                          value={aiTargetInput}
                          onChange={e => setAiTargetInput(e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Raw HTTP Request (Burp Suite / Zap)</label>
                       <textarea 
                         className="w-full bg-slate-900 text-green-400 font-mono border border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none h-64 resize-y"
                         placeholder={`POST /api/login HTTP/1.1\nHost: example.com\nContent-Type: application/json\n\n{"user": "admin", "pass": "123456"}`}
                         value={rawRequestInput}
                         onChange={e => setRawRequestInput(e.target.value)}
                       />
                       <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <Zap size={12} />
                          Dán request thô vào đây. AI sẽ tự động phát hiện tham số và tạo các test case OWASP phù hợp.
                       </p>
                     </div>
                   </div>
                 )}
               </div>
               
               {!isAiAnalyzing && (
                 <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                   <button 
                     onClick={() => setIsAiModalOpen(false)}
                     className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                   >
                     Hủy
                   </button>
                   <button 
                     onClick={handleAiAnalysis}
                     disabled={!rawRequestInput.trim()}
                     className="px-4 py-2 bg-purple-600 text-white font-medium hover:bg-purple-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
                   >
                     <Sparkles size={16} /> Phân tích & Tạo Test Case
                   </button>
                 </div>
               )}
             </div>
           </div>
        )}

        {/* Add Test Form */}
        {isAddingTest && (
          <div className="bg-white border border-indigo-200 rounded-xl p-6 mb-6 shadow-md ring-1 ring-indigo-50">
            <h4 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Thêm Test Case Mới</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề Test Case <span className="text-red-500">*</span>
                </label>
                <input 
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  placeholder="Ví dụ: Test nhập script vào ô tìm kiếm"
                  value={newTestTitle}
                  onChange={e => setNewTestTitle(e.target.value)}
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Mapping OWASP (Ánh xạ) <span className="text-red-500">*</span>
                </label>
                <select 
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={newTestWstgId}
                  onChange={e => setNewTestWstgId(e.target.value)}
                >
                  <option value="">-- Chọn chuẩn OWASP tương ứng --</option>
                  {WSTG_CATEGORIES.map(cat => (
                    <optgroup key={cat.id} label={cat.name}>
                      {cat.tests.map(t => (
                        <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {newTestWstgId && (
                  <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                    <ExternalLink size={10} />
                    Ref: {getWstgInfo(newTestWstgId)?.category}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                   Chức năng / Link (Target)
                 </label>
                 <input 
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
                  placeholder="Ví dụ: /api/login, Chức năng Search..."
                  value={newTestTarget}
                  onChange={e => setNewTestTarget(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả / Các bước thực hiện</label>
                <textarea 
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-y placeholder:text-slate-400"
                  placeholder="Mô tả chi tiết cách tái hiện lỗi..."
                  value={newTestDesc}
                  onChange={e => setNewTestDesc(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button 
                onClick={() => setIsAddingTest(false)}
                className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleAddTestCase}
                disabled={!newTestTitle || !newTestWstgId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Lưu Test Case
              </button>
            </div>
          </div>
        )}

        {/* List Content */}
        {selectedProject.testCases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400 mb-2">Chưa có test case nào.</p>
            <p className="text-sm text-slate-500">Hãy thêm test case và ánh xạ nó với chuẩn OWASP.</p>
          </div>
        ) : filteredTestCases.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">Không tìm thấy test case nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTestCases.map((tc) => {
              const wstgInfo = getWstgInfo(tc.wstgId);
              return (
                <div key={tc.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Only show Severity if Status is Completed */}
                        {tc.status === TestStatus.COMPLETED && (
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide
                             ${tc.severity === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' : 
                               tc.severity === 'High' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                               tc.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                               tc.severity === 'Low' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                               'bg-slate-100 text-slate-800 border-slate-200'
                             }`}>
                             {tc.severity} {tc.cvssScore ? `(${tc.cvssScore})` : ''}
                           </span>
                        )}
                        <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                          {tc.title}
                          {tc.tags && tc.tags.includes('AI') && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                              <Sparkles size={10} /> AI
                            </span>
                          )}
                        </h4>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                          {/* Target / Link Display */}
                          {tc.target && (
                            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 text-xs font-medium" title="Target / Function">
                                <Globe size={12} />
                                {tc.target}
                            </div>
                          )}

                          {/* Mapping Info */}
                          <div className="flex items-center gap-2 bg-slate-50 p-1 px-2 rounded-lg border border-slate-100 inline-flex">
                            <span className="text-xs font-bold text-slate-500 uppercase">Mapping:</span>
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-white px-1.5 py-0.5 border border-indigo-100 rounded">
                            {tc.wstgId}
                            </span>
                            <span className="text-xs text-slate-600 truncate max-w-xs border-l border-slate-200 pl-2">
                            {wstgInfo?.title || 'Unknown Ref'}
                            </span>
                          </div>
                      </div>

                      <p className="text-sm text-slate-600 whitespace-pre-wrap mb-4">{tc.description}</p>
                      
                      <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Status:</label>
                            <select 
                              value={tc.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(tc, e.target.value)}
                              className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500
                                ${tc.status === TestStatus.COMPLETED ? 'bg-green-50 text-green-700 border-green-200' :
                                  tc.status === TestStatus.IN_PROGRESS ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  tc.status === TestStatus.NOT_BUG ? 'bg-slate-100 text-slate-500 border-slate-200 line-through' :
                                  'bg-white text-slate-700 border-slate-300'
                                }`}
                            >
                              <option value={TestStatus.NOT_STARTED}>NOT STARTED</option>
                              <option value={TestStatus.IN_PROGRESS}>IN PROGRESS</option>
                              <option value={TestStatus.COMPLETED}>COMPLETED</option>
                              <option value={TestStatus.NOT_BUG}>NOT BUG / NON VULN</option>
                            </select>
                         </div>
                         
                         {tc.status === TestStatus.COMPLETED && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleViewReport(tc); }}
                             className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                           >
                              <Eye size={12} /> {isReconTask(tc.wstgId) ? 'Xem kết quả' : 'Xem báo cáo'}
                           </button>
                         )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 ml-4">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setEditingTestCase(tc); }}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                         title="Chỉnh sửa"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); onDuplicateTestCase(selectedProject.id, tc.id); }}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                         title="Nhân bản"
                       >
                         <Copy size={16} />
                       </button>
                       <button 
                         onClick={(e) => handleConfirmDeleteTestCase(e, tc.id)}
                         className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                         title="Xóa"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Edit Test Case Modal Overlay */}
      {editingTestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingTestCase(null)}>
           <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0">
                 <h3 className="font-bold text-lg text-slate-900">Chỉnh sửa Test Case</h3>
                 <button onClick={() => setEditingTestCase(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề</label>
                    <input 
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={editingTestCase.title}
                      onChange={e => setEditingTestCase({...editingTestCase, title: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chức năng / Link (Target)</label>
                    <input 
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={editingTestCase.target || ''}
                      onChange={e => setEditingTestCase({...editingTestCase, target: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mapping OWASP</label>
                    <select 
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={editingTestCase.wstgId}
                      onChange={e => setEditingTestCase({...editingTestCase, wstgId: e.target.value})}
                    >
                      {WSTG_CATEGORIES.map(cat => (
                        <optgroup key={cat.id} label={cat.name}>
                          {cat.tests.map(t => (
                            <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả</label>
                    <textarea 
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-32 resize-y"
                      value={editingTestCase.description}
                      onChange={e => setEditingTestCase({...editingTestCase, description: e.target.value})}
                    />
                 </div>
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-2">
                 <button 
                   onClick={() => setEditingTestCase(null)}
                   className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                 >
                   Hủy
                 </button>
                 <button 
                   onClick={handleSaveEditedTestCase}
                   className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-lg"
                 >
                   Lưu Thay Đổi
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* CVSS & Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto backdrop-blur-sm" onClick={() => setReportModalOpen(false)}>
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-600 text-white">
                 <div className="flex items-center gap-2">
                    {isActiveTestRecon ? <Search size={20} /> : <Calculator size={20} />}
                    <h3 className="font-bold text-lg">
                        {isActiveTestRecon ? "Kết quả Thu thập Thông tin (Recon)" : "Báo cáo Lỗ hổng & Đánh giá"}
                    </h3>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={exportSingleReportMarkdown}
                       className="text-xs bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                       title="Tải về file báo cáo (.md)"
                    >
                       <Share size={12} /> Xuất file báo cáo
                    </button>
                    <button onClick={() => setReportModalOpen(false)} className="text-white/80 hover:text-white">
                        <X size={24} />
                    </button>
                 </div>
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                 <button 
                    onClick={() => setActiveReportTab('details')}
                    className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                       activeReportTab === 'details' 
                       ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                       : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                 >
                    {isActiveTestRecon ? (
                        <><Database size={16} /> Ghi chú & Dữ liệu</>
                    ) : (
                        <><FileText size={16} /> Chi tiết lỗi & PoC</>
                    )}
                 </button>
                 
                 {!isActiveTestRecon && (
                     <button 
                        onClick={() => setActiveReportTab('cvss')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                           activeReportTab === 'cvss' 
                           ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' 
                           : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                     >
                        <Activity size={16} /> Tính điểm CVSS 3.1
                     </button>
                 )}
              </div>

              <div className="p-6 max-h-[60vh] overflow-y-auto">
                 {/* Content Tab: Report Details */}
                 {activeReportTab === 'details' && (
                    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-300">
                       
                       <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                             {isActiveTestRecon ? "Tổng quan / Phân tích (Analysis)" : "Mô tả lỗ hổng (Description)"}
                          </label>
                          <textarea 
                             className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[100px]"
                             placeholder={isActiveTestRecon ? "Tóm tắt những thông tin quan trọng tìm thấy..." : "Mô tả chi tiết lỗ hổng..."}
                             value={reportData.vulnDescription}
                             onChange={e => setReportData({...reportData, vulnDescription: e.target.value})}
                          />
                       </div>

                       {!isActiveTestRecon && (
                           <div>
                              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ảnh hưởng (Impact)</label>
                              <textarea 
                                 className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[80px]"
                                 placeholder="Lỗ hổng này ảnh hưởng như thế nào đến hệ thống (CIA triad)..."
                                 value={reportData.impact}
                                 onChange={e => setReportData({...reportData, impact: e.target.value})}
                              />
                           </div>
                       )}

                       <div className="flex-1 flex flex-col">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                             {isActiveTestRecon ? "Dữ liệu thu thập được (Findings / Raw Data)" : "Bằng chứng (PoC)"}
                          </label>
                          <div className="bg-blue-50 p-2 rounded-lg mb-2 text-[10px] text-blue-700 flex gap-2">
                             <AlertTriangle size={14} className="shrink-0" />
                             <p>{isActiveTestRecon 
                                ? "Dán các IP, Subdomain, Tech stack hoặc thông tin nhạy cảm tìm thấy vào đây."
                                : "Mô tả chi tiết các bước tái hiện, payload sử dụng, và dán URL hoặc request/response HTTP vào đây."}
                             </p>
                          </div>
                          <textarea 
                             className="flex-1 w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[150px]"
                             placeholder={isActiveTestRecon ? "1.2.3.4\nsub.target.com\nServer: Nginx 1.18..." : "1. Truy cập URL...&#10;2. Nhập payload...&#10;3. Quan sát phản hồi..."}
                             value={reportData.poc}
                             onChange={e => setReportData({...reportData, poc: e.target.value})}
                          />
                       </div>

                       {!isActiveTestRecon && (
                           <>
                               <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khuyến nghị (Recommendation)</label>
                                  <textarea 
                                     className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[80px]"
                                     placeholder="Đề xuất biện pháp khắc phục..."
                                     value={reportData.recommendation}
                                     onChange={e => setReportData({...reportData, recommendation: e.target.value})}
                                  />
                               </div>

                               <div>
                                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tham khảo (References)</label>
                                  <textarea 
                                     className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y min-h-[60px]"
                                     placeholder="Link tài liệu tham khảo (OWASP, CVE)..."
                                     value={reportData.references}
                                     onChange={e => setReportData({...reportData, references: e.target.value})}
                                  />
                               </div>
                           </>
                       )}
                    </div>
                 )}

                 {/* Content Tab: CVSS */}
                 {activeReportTab === 'cvss' && !isActiveTestRecon && (
                    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                       <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                          <h4 className="font-bold text-slate-900">CVSS Base Score Metrics</h4>
                          <a href="https://www.first.org/cvss/calculator/3.1" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                             <ExternalLink size={10} /> FIRST.org Calculator
                          </a>
                       </div>
                       
                       {/* Exploitability Metrics */}
                       <div className="space-y-4">
                          <h5 className="text-xs font-bold text-slate-500 uppercase bg-slate-50 p-1 px-2 rounded inline-block">Exploitability Metrics</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Attack Vector (AV)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.AV} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, AV: e.target.value})}
                                >
                                   <option value="N">Network (N)</option>
                                   <option value="A">Adjacent (A)</option>
                                   <option value="L">Local (L)</option>
                                   <option value="P">Physical (P)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Attack Complexity (AC)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.AC} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, AC: e.target.value})}
                                >
                                   <option value="L">Low (L)</option>
                                   <option value="H">High (H)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Privileges Required (PR)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.PR} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, PR: e.target.value})}
                                >
                                   <option value="N">None (N)</option>
                                   <option value="L">Low (L)</option>
                                   <option value="H">High (H)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">User Interaction (UI)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.UI} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, UI: e.target.value})}
                                >
                                   <option value="N">None (N)</option>
                                   <option value="R">Required (R)</option>
                                </select>
                             </div>
                          </div>
                       </div>

                       {/* Impact Metrics */}
                       <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h5 className="text-xs font-bold text-slate-500 uppercase bg-slate-50 p-1 px-2 rounded inline-block">Scope & Impact Metrics</h5>
                          <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">Scope (S)</label>
                             <select 
                                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={cvssMetrics.S} 
                                onChange={e => setCvssMetrics({...cvssMetrics, S: e.target.value})}
                             >
                                <option value="U">Unchanged (U)</option>
                                <option value="C">Changed (C)</option>
                             </select>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Confidentiality (C)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.C} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, C: e.target.value})}
                                >
                                   <option value="H">High (H)</option>
                                   <option value="L">Low (L)</option>
                                   <option value="N">None (N)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Integrity (I)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.I} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, I: e.target.value})}
                                >
                                   <option value="H">High (H)</option>
                                   <option value="L">Low (L)</option>
                                   <option value="N">None (N)</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Availability (A)</label>
                                <select 
                                   className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                   value={cvssMetrics.A} 
                                   onChange={e => setCvssMetrics({...cvssMetrics, A: e.target.value})}
                                >
                                   <option value="H">High (H)</option>
                                   <option value="L">Low (L)</option>
                                   <option value="N">None (N)</option>
                                </select>
                             </div>
                          </div>
                       </div>

                       <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex items-center justify-between mt-6">
                          <div>
                             <span className="block text-xs font-bold text-slate-500 uppercase">Calculated Score</span>
                             <span className={`text-3xl font-bold ${
                               calculateCVSS() >= 9 ? 'text-red-600' :
                               calculateCVSS() >= 7 ? 'text-orange-600' :
                               calculateCVSS() >= 4 ? 'text-yellow-600' :
                               'text-blue-600'
                             }`}>{calculateCVSS()}</span>
                          </div>
                          <div className="text-right">
                             <span className="block text-xs font-bold text-slate-500 uppercase">Severity</span>
                             <span className={`px-3 py-1 rounded text-sm font-bold uppercase ${
                               calculateCVSS() >= 9 ? 'bg-red-100 text-red-800' :
                               calculateCVSS() >= 7 ? 'bg-orange-100 text-orange-800' :
                               calculateCVSS() >= 4 ? 'bg-yellow-100 text-yellow-800' :
                               calculateCVSS() > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                             }`}>
                               {getSeverityFromScore(calculateCVSS())}
                             </span>
                          </div>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                 <button 
                   onClick={() => setReportModalOpen(false)}
                   className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg"
                 >
                   Đóng
                 </button>
                 <button 
                   onClick={handleSaveReport}
                   className="px-5 py-2.5 bg-green-600 text-white font-bold hover:bg-green-700 rounded-lg shadow-lg shadow-green-200 flex items-center gap-2"
                 >
                   <Check size={18} /> Hoàn thành & Lưu kết quả
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
