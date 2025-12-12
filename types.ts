
export interface PayloadItem {
  code: string;
  description: string;
}

export interface WSTGTest {
  id: string;
  category: string;
  title: string;
  description: string;
  objectives: string[];
  instructions: string; // Will be split by newlines for step-by-step view
  payloads: PayloadItem[]; // Changed from string[] to PayloadItem[]
  strategy: string;
  severity: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface WSTGCategory {
  id: string;
  name: string;
  tests: WSTGTest[];
}

export enum TestStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_BUG = 'NOT_BUG', // Changed from NOT_APPLICABLE
}

export interface TestProgress {
  [testId: string]: {
    status: TestStatus;
    userPayloads: PayloadItem[]; // Changed from notes: string
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- New Types for Project Management ---

export interface ProjectTestCase {
  id: string;
  projectId: string;
  title: string;       // e.g., "Test nhập tên có ký tự lạ"
  wstgId: string;      // e.g., "WSTG-INPV-02" (The Mapping)
  description: string; // Specific steps for this project
  status: TestStatus;
  severity: 'Info' | 'Low' | 'Medium' | 'High' | 'Critical';
  notes: string;
  createdAt: number;
  tags?: string[];     // Added tags support (e.g., 'AI')
  target?: string;     // Added target (Function/Link) field
  
  // New Report Fields
  poc?: string;
  vulnDescription?: string;
  impact?: string;
  recommendation?: string;
  references?: string;
  
  cvssVector?: string;
  cvssScore?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  testCases: ProjectTestCase[];
}
