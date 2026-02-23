export type PersonaId =
  | 'casual-investor'
  | 'active-trader'
  | 'defi-explorer'
  | 'analyst-researcher'
  | 'freelancer-consultant'
  | 'content-creator'
  | 'fund-manager';

export interface QuickAction {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  description: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  description: string;
  href: string;
}

export interface PersonaDefinition {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string; // Tailwind color key
  primaryDashboards: string[];
  secondaryDashboards: string[];
  primaryTools: string[];
  primaryTemplates: string[];
  quickActions: QuickAction[];
  suggestedWorkflow: WorkflowStep[];
}

export interface UserPreferences {
  persona?: PersonaId;
  onboardingCompleted?: boolean;
}
