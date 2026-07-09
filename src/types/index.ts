export type UserRole = "product_manager" | "tech_lead";
export type StatusColor = "Green" | "Amber" | "Red";
export type ReviewCadence = "monthly" | "quarterly";
export type AnalysisMode = "deterministic" | "non_deterministic";
export type ProjectStatus =
  | "awaiting_pm"
  | "awaiting_tl"
  | "processing"
  | "generating_pdf"
  | "ready"
  | "sent";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  project_name: string;
  customer_name: string;
  review_cadence: ReviewCadence;
  quarter: string;
  start_date: string;
  assigned_pm: string | null;
  assigned_tl: string | null;
  recipient_emails: string[];
  status: ProjectStatus;
  pdf_url: string | null;
  email_sent_at: string | null;
  manual_email_sent_at: string | null;
  created_by: string | null;
  created_at: string;
  error_message: string | null;
  analysis_mode: AnalysisMode;
}

export interface PmAnswers {
  id: string;
  project_id: string | null;
  prepared_by: string;
  pm_q1: string | null;
  pm_q2: StatusColor | null;
  pm_q2_justification: string | null;
  pm_q3: string | null;
  pm_q4: string | null;
  pm_q5: string | null;
  pm_q6: string | null;
  pm_q7: string | null;
  pm_q8: StatusColor | null;
  pm_q8_notes: string | null;
  reporting_period: string | null;
  pm_q_notes: string | null;
  itsm_pm_1: string | null;
  itsm_pm_2: string | null;
  itsm_pm_3: string | null;
  itsm_pm_4: string | null;
  itsm_pm_5: string | null;
  itsm_pm_6: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
}

export interface TlAnswers {
  id: string;
  project_id: string | null;
  tl_q1: string | null;
  tl_q2: StatusColor | null;
  tl_q2_justification: string | null;
  tl_q3: string | null;
  tl_q4: string | null;
  tl_q5: string | null;
  tl_q6: string | null;
  tl_q7: string | null;
  itsm_tl_1: string | null;
  itsm_tl_2: string | null;
  itsm_tl_3: string | null;
  itsm_tl_4: string | null;
  itsm_tl_5: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
}

export interface TokenUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cost_usd: number;
}

export interface AnalysisResult {
  id: string;
  project_id: string | null;
  analysis: AnalysisJson;
  token_usage: TokenUsage | null;
  cost_usd: number | null;
  generated_at: string;
}

export interface Settings {
  id: string;
  organisation_name: string;
  organisation_logo: string | null;
  delivery_cadence: ReviewCadence;
  send_on_day: number;
  recipient_emails: string[];
  updated_at: string;
}

export interface CustomerLogo {
  id: string;
  customer_name: string;
  logo_url: string;
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface ProjectWithAssignees extends Project {
  assigned_pm_name: string | null;
  assigned_tl_name: string | null;
  pm_submitted: boolean;
  tl_submitted: boolean;
  pm_draft: boolean;
  tl_draft: boolean;
}

export interface CreateProjectInput {
  project_name: string;
  customer_name: string;
  review_cadence: ReviewCadence;
  quarter: string;
  assigned_pm: string | null;
  assigned_tl: string | null;
  recipient_emails: string[];
  created_by: string | null;
  analysis_mode: AnalysisMode;
}

export type CrossAnalysisRelationship =
  | "AGREE"
  | "DISAGREE"
  | "COMPLEMENT"
  | "BLIND_SPOT";

export interface AnalysisJson {
  report_meta: {
    customer_name: string;
    reporting_period: string;
    prepared_by: string;
    date_generated: string;
    pm_status: StatusColor;
    tl_status: StatusColor;
    status_aligned: boolean;
  };
  section_synthesis: {
    s1_executive_summary: {
      delivery_focus: string;
      overall_status: StatusColor;
      highlights: string;
      areas_requiring_attention: string;
      next_quarter_preview: string;
    };
    s2_service_overview: {
      active_services: string;
      delivery_model: string;
      key_stakeholders: string;
      team_composition: string;
      reporting_cadence: string;
    };
    s3_achievements: { achievement: string; impact: string }[];
    s4_delivery_summary: {
      workstream: string;
      status: StatusColor;
      summary: string;
      notes: string;
    }[];
    s5_metrics: {
      metric: string;
      target: string;
      actual: string;
      status: StatusColor;
      comment: string;
    }[];
    s6_support_summary: {
      ticket_counts: {
        total: { count: string; summary: string };
        resolved: { count: string; summary: string };
        open: { count: string; summary: string };
        critical: { count: string; summary: string };
        major: { count: string; summary: string };
        recurring: { count: string; summary: string };
      };
      major_incidents: {
        date: string;
        issue: string;
        impact: string;
        root_cause: string;
        action: string;
        status: string;
      }[];
    };
    s7_quality_health: {
      area: string;
      observation: string;
      status: StatusColor;
      improvement_action: string;
    }[];
    s8_risks: {
      type: "Risk" | "Issue" | "Dependency";
      description: string;
      impact: "High" | "Medium" | "Low";
      owner: string;
      mitigation: string;
    }[];
    s9_customer_feedback: {
      satisfaction: string;
      communication: string;
      responsiveness: string;
      business_alignment: string;
      areas_of_concern: string;
      relationship_health: StatusColor;
    };
  };
  ai_generated: {
    s10_value_delivered: {
      business_value: string;
      operational_value: string;
      technical_value: string;
      strategic_value: string;
    };
    s10_cross_analysis: {
      topic: string;
      relationship: CrossAnalysisRelationship;
      finding: string;
    }[];
    s11_lessons_learned: { lesson: string; context: string; action: string }[];
    s12_next_quarter_focus: {
      focus_area: string;
      expected_outcome: string;
      owner: "Product Manager" | "Tech Lead" | "Product Manager, Tech Lead";
    }[];
    s13_management_attention: {
      item: string;
      type:
        | "Decision"
        | "Approval"
        | "Budget"
        | "Resource"
        | "Escalation"
        | "Misalignment";
      explanation: string;
      urgency: "High" | "Medium" | "Low";
      source:
        | "Product Manager"
        | "Tech Lead"
        | "Product Manager, Tech Lead"
        | "Disagreement";
    }[];
    s15_itsm_maturity: {
      topic: string;
      pm_perspective: string;
      tl_perspective: string;
      finding: string;
      relationship: CrossAnalysisRelationship;
    }[];
    s16_closing_note: string;
  };
}
