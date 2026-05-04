// ============================================================
// ALL TYPESCRIPT TYPES FOR INVESTOR SAATHI CRM
// ============================================================

export type UserRole = 'sales_rep' | 'team_lead' | 'admin'

export type LeadSource =
  | 'referral'
  | 'social_media'
  | 'website'
  | 'cold_call'
  | 'event'
  | 'other'

export type LeadStage =
  | 'new_lead'
  | 'contacted'
  | 'interested'
  | 'meeting_scheduled'
  | 'site_visit'
  | 'negotiation'
  | 'converted'
  | 'lost'

export type LostReason =
  | 'price_issue'
  | 'trust_issue'
  | 'not_interested'
  | 'timing_issue'
  | 'competitor_chosen'
  | 'no_response'
  | 'other'

export type InterestLevel = 'high' | 'medium' | 'low'
export type Sentiment = 'positive' | 'neutral' | 'negative'
export type ObjectionCategory = 'trust' | 'price' | 'timing' | 'competition' | 'other'
export type InteractionType = 'call' | 'whatsapp' | 'meeting' | 'email' | 'other'
export type InteractionOutcome =
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'callback_requested'
  | 'meeting_set'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'
export type DocumentType = 'kyc' | 'payments' | 'receipts' | 'legal'

// ──────────────────────────────────────────────────────────
// DATABASE TYPES (mirror Supabase tables)
// ──────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: UserRole
  team_id: string | null
  is_active: boolean
  force_password_change: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  team_lead_id: string | null
  created_at: string
}

export interface Lead {
  id: string
  created_at: string
  updated_at: string
  assigned_to: string | null
  team_id: string | null
  full_name: string
  phone: string
  email: string | null
  city: string | null
  source: LeadSource
  stage: LeadStage
  stage_updated_at: string
  is_lost: boolean
  lost_at_stage: string | null
  lost_reason: LostReason | null
  lost_reason_detail: string | null
  lead_score: number | null
  interest_level: InterestLevel | null
  sentiment: Sentiment | null
  objection_category: ObjectionCategory | null
  next_step: string | null
  follow_up_date: string | null
  last_contacted_at: string | null
  // Joined fields
  assigned_profile?: Profile
  team?: Team
}

export interface LeadStageHistory {
  id: string
  lead_id: string
  from_stage: string
  to_stage: string
  changed_by: string
  changed_at: string
  notes: string | null
  changed_by_profile?: Profile
}

export interface Interaction {
  id: string
  lead_id: string
  logged_by: string
  logged_at: string
  type: InteractionType
  outcome: InteractionOutcome | null
  notes: string | null
  duration_minutes: number | null
  follow_up_required: boolean
  follow_up_date: string | null
  logged_by_profile?: Profile
}

export interface LeadNote {
  id: string
  lead_id: string
  updated_by: string | null
  updated_at: string
  call_summary: string | null
  interest_level: InterestLevel | null
  sentiment: Sentiment | null
  buying_stage_self_reported: string | null
  lead_score: number | null
  objection_category: ObjectionCategory | null
  objection_detail: string | null
  next_step: string | null
  follow_up_date: string | null
}

export interface OnboardingToken {
  id: string
  token: string
  lead_id: string
  created_by: string
  created_at: string
  expires_at: string
  used: boolean
  used_at: string | null
}

export interface ClientProfile {
  id: string
  lead_id: string
  created_at: string
  updated_at: string
  updated_by: string | null
  full_name: string
  phone: string
  email: string
  date_of_birth: string | null
  age_range: string | null
  occupation: string | null
  city: string | null
  state: string | null
  pan_number: string | null
  aadhaar_number: string | null
  pan_doc_path: string | null
  aadhaar_doc_path: string | null
  investment_budget: string | null
  heard_about_us: string | null
  project_interest: string | null
  plot_unit_details: string | null
  lead_source_confirmed: string | null
  why_chose_us: string | null
}

export interface Document {
  id: string
  client_id: string
  document_type: DocumentType
  file_path: string
  file_name: string
  uploaded_by: string | null
  uploaded_at: string
  is_admin_override: boolean
}

export interface PaymentMilestone {
  id: string
  client_id: string
  milestone_name: string
  amount: number
  due_date: string
  status: PaymentStatus
  paid_at: string | null
  payment_proof_url: string | null
  receipt_id: string | null
  receipt_url: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  link: string | null
  created_at: string
}

// ──────────────────────────────────────────────────────────
// API REQUEST / RESPONSE TYPES
// ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface CreateLeadInput {
  full_name: string
  phone: string
  email?: string
  city?: string
  source: LeadSource
  assigned_to?: string
  team_id?: string
}

export interface UpdateLeadStageInput {
  stage: LeadStage
  notes?: string
  lost_reason?: LostReason
  lost_reason_detail?: string
}

export interface CreateInteractionInput {
  lead_id: string
  type: InteractionType
  outcome?: InteractionOutcome
  notes?: string
  duration_minutes?: number
  follow_up_required?: boolean
  follow_up_date?: string
}

export interface OnboardingFormData {
  full_name: string
  phone: string
  email: string
  date_of_birth?: string
  age_range?: string
  occupation?: string
  city?: string
  state?: string
  pan_number?: string
  aadhaar_number?: string
  investment_budget?: string
  heard_about_us?: string
  project_interest?: string
  plot_unit_details?: string
  lead_source_confirmed?: string
  why_chose_us?: string
}

export interface CreatePaymentMilestoneInput {
  client_id: string
  milestone_name: string
  amount: number
  due_date: string
}

// ──────────────────────────────────────────────────────────
// UI / DISPLAY TYPES
// ──────────────────────────────────────────────────────────

export interface DashboardKPIs {
  total_leads: number
  converted: number
  conversion_rate: number
  follow_up_rate: number
  avg_lead_score: number
  revenue_collected: number
  qualified_conversion_pct: number
}

export interface SalespersonStats {
  profile: Profile
  total_leads: number
  contacted: number
  converted: number
  revenue_collected: number
  conversion_pct: number
  follow_up_rate: number
  north_star_pct: number
  top_lost_reason: string | null
}

export interface PipelineFunnelData {
  stage: string
  count: number
  label: string
}

export interface LeadSourceData {
  source: string
  count: number
}

export interface WeeklyTrendData {
  date: string
  calls: number
  meetings: number
}

// ──────────────────────────────────────────────────────────
// DISPLAY LABEL MAPS
// ──────────────────────────────────────────────────────────

export const STAGE_LABELS: Record<LeadStage, string> = {
  new_lead:          'New Lead',
  contacted:         'Contacted',
  interested:        'Interested',
  meeting_scheduled: 'Meeting Scheduled',
  site_visit:        'Site Visit',
  negotiation:       'Negotiation',
  converted:         'Converted',
  lost:              'Lost',
}

export const STAGE_ORDER: LeadStage[] = [
  'new_lead',
  'contacted',
  'interested',
  'meeting_scheduled',
  'site_visit',
  'negotiation',
  'converted',
  'lost',
]

export const SOURCE_LABELS: Record<LeadSource, string> = {
  referral:     'Referral',
  social_media: 'Social Media',
  website:      'Website',
  cold_call:    'Cold Call',
  event:        'Event',
  other:        'Other',
}

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price_issue:       'Price Issue',
  trust_issue:       'Trust Issue',
  not_interested:    'Not Interested',
  timing_issue:      'Timing Issue',
  competitor_chosen: 'Competitor Chosen',
  no_response:       'No Response',
  other:             'Other',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  sales_rep: 'Sales Rep',
  team_lead: 'Team Lead',
  admin:     'Admin',
}