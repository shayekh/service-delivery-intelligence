import { createServerSupabaseClient } from "@/lib/supabase-server";
import type {
  AnalysisJson,
  CreateProjectInput,
  CustomerLogo,
  PmAnswers,
  Project,
  ProjectWithAssignees,
  Settings,
  TlAnswers,
  User,
} from "@/types";

interface ProjectWithAssigneesRow extends Project {
  assigned_pm_user: { full_name: string } | null;
  assigned_tl_user: { full_name: string } | null;
}

// Projects

export async function getAllProjects(): Promise<Project[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getAllProjectsWithAssignees(): Promise<
  ProjectWithAssignees[]
> {
  const supabase = await createServerSupabaseClient();

  const [projectsResult, pmAnswersResult, tlAnswersResult] = await Promise.all([
    supabase
      .from("projects")
      .select(
        "*, assigned_pm_user:users!projects_assigned_pm_fkey(full_name), assigned_tl_user:users!projects_assigned_tl_fkey(full_name)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("pm_answers").select("project_id").not("submitted_at", "is", null),
    supabase.from("tl_answers").select("project_id").not("submitted_at", "is", null),
  ]);

  if (projectsResult.error) throw projectsResult.error;
  if (pmAnswersResult.error) throw pmAnswersResult.error;
  if (tlAnswersResult.error) throw tlAnswersResult.error;

  const pmSubmittedProjectIds = new Set(
    (pmAnswersResult.data ?? []).map((row) => row.project_id)
  );
  const tlSubmittedProjectIds = new Set(
    (tlAnswersResult.data ?? []).map((row) => row.project_id)
  );

  return ((projectsResult.data ?? []) as unknown as ProjectWithAssigneesRow[]).map(
    (row) => ({
      ...row,
      assigned_pm_name: row.assigned_pm_user?.full_name ?? null,
      assigned_tl_name: row.assigned_tl_user?.full_name ?? null,
      pm_submitted: pmSubmittedProjectIds.has(row.id),
      tl_submitted: tlSubmittedProjectIds.has(row.id),
    })
  );
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as Project) ?? null;
}

export async function createProject(
  data: CreateProjectInput
): Promise<Project> {
  const supabase = await createServerSupabaseClient();
  const { data: created, error } = await supabase
    .from("projects")
    .insert(data)
    .select("*")
    .single();

  if (error) throw error;
  return created as Project;
}

export async function updateProjectStatus(
  id: string,
  status: Project["status"]
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function updateProjectPdfUrl(id: string, pdfUrl: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ pdf_url: pdfUrl })
    .eq("id", id);

  if (error) throw error;
}

export async function setProjectError(id: string, message: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ error_message: message })
    .eq("id", id);

  if (error) throw error;
}

export async function clearProjectError(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("projects")
    .update({ error_message: null })
    .eq("id", id);

  if (error) throw error;
}

// Users

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as User) ?? null;
}

export async function getAllPMs(): Promise<User[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "product_manager");

  if (error) throw error;
  return (data ?? []) as User[];
}

export async function getAllTLs(): Promise<User[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "tech_lead");

  if (error) throw error;
  return (data ?? []) as User[];
}

// Answers

export async function getPMAnswers(
  projectId: string
): Promise<PmAnswers | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("pm_answers")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return (data as PmAnswers) ?? null;
}

export async function getTLAnswers(
  projectId: string
): Promise<TlAnswers | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tl_answers")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw error;
  return (data as TlAnswers) ?? null;
}

export async function savePMAnswers(
  data: Omit<PmAnswers, "id">
): Promise<PmAnswers> {
  const supabase = await createServerSupabaseClient();
  const { data: saved, error } = await supabase
    .from("pm_answers")
    .upsert(data, { onConflict: "project_id" })
    .select("*")
    .single();

  if (error) {
    console.error("savePMAnswers Supabase error:", JSON.stringify(error, null, 2));
    throw new Error(`savePMAnswers failed: ${error.message} (code: ${error.code})`);
  }
  return saved as PmAnswers;
}

export async function saveTLAnswers(
  data: Omit<TlAnswers, "id">
): Promise<TlAnswers> {
  const supabase = await createServerSupabaseClient();
  const { data: saved, error } = await supabase
    .from("tl_answers")
    .upsert(data, { onConflict: "project_id" })
    .select("*")
    .single();

  if (error) {
    console.error("saveTLAnswers Supabase error:", JSON.stringify(error, null, 2));
    throw new Error(`saveTLAnswers failed: ${error.message} (code: ${error.code})`);
  }
  return saved as TlAnswers;
}

// Analysis

export async function saveAnalysisResult(
  projectId: string,
  analysis: AnalysisJson
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("analysis_results").insert({
    project_id: projectId,
    analysis,
    generated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("saveAnalysisResult Supabase error:", JSON.stringify(error, null, 2));
    throw new Error(`saveAnalysisResult failed: ${error.message} (code: ${error.code})`);
  }
}

export async function getCustomerLogoByName(
  customerName: string
): Promise<CustomerLogo | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customer_logos")
    .select("*")
    .eq("customer_name", customerName)
    .order("uploaded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as CustomerLogo) ?? null;
}

export async function getAnalysisResult(
  projectId: string
): Promise<AnalysisJson | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("analysis_results")
    .select("analysis")
    .eq("project_id", projectId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.analysis as AnalysisJson) ?? null;
}

// Settings

export async function getSettings(): Promise<Settings> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .limit(1)
    .single();

  if (error) throw error;
  return data as Settings;
}
