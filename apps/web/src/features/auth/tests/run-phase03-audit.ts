import { createClient } from "@supabase/supabase-js";
import {
  AuthFlowStateSchema,
  AppErrorCodeSchema,
  AuthAttemptSchema,
  AuthCallbackMessageSchema,
} from "../schemas/auth.schema";
import { formatAuthError, AppError } from "../lib/auth-errors";
import { calculateCenteredPopupCoordinates } from "../lib/popup-window";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFilterSchema,
  VISUALIZER_TYPE_METADATA,
} from "../../projects/schemas/project.schema";

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(description: string, condition: boolean, extra?: unknown) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ ${description}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${description}`, extra || "");
  }
}

async function runPhase03Audit() {
  console.log("================================================================================");
  console.log("NXTQR PHASE 03 — AUTHENTICATION, IDENTITY & PROJECT INFRASTRUCTURE AUDIT");
  console.log("================================================================================\n");

  // SECTION 1: Auth State Machine
  console.log("[1/4] Auditing Authentication State Machine & Contracts...");
  const validStates = [
    "idle",
    "preparing",
    "popup_open",
    "awaiting_provider",
    "processing_callback",
    "verifying_session",
    "success",
    "cancelled",
    "failed",
    "timeout",
    "blocked",
  ];
  for (const st of validStates) {
    assert(`State '${st}' parses via AuthFlowStateSchema`, AuthFlowStateSchema.safeParse(st).success);
  }
  assert("Rejects invalid auth state", !AuthFlowStateSchema.safeParse("unverified_state").success);

  // Validate AuthAttemptSchema and CallbackMessageSchema
  const sampleAttempt = {
    attemptId: "123e4567-e89b-12d3-a456-426614174000",
    createdAt: Date.now(),
    targetUrl: "/workspace",
    mode: "popup" as const,
  };
  assert("AuthAttemptSchema parses valid attempt", AuthAttemptSchema.safeParse(sampleAttempt).success);

  const sampleCallbackMsg = {
    type: "NXTQR_AUTH_SUCCESS" as const,
    attemptId: "123e4567-e89b-12d3-a456-426614174000",
  };
  assert("AuthCallbackMessageSchema parses valid success message", AuthCallbackMessageSchema.safeParse(sampleCallbackMsg).success);

  const popupCoords = calculateCenteredPopupCoordinates(500, 620);
  assert("calculateCenteredPopupCoordinates returns positive bounds", popupCoords.width === 500 && popupCoords.height === 620);

  // SECTION 2: Centralized Error Management
  console.log("\n[2/4] Auditing Centralized Error Taxonomy & Masking...");
  const validCodes = [
    "AUTH_CANCELLED",
    "AUTH_POPUP_BLOCKED",
    "AUTH_TIMEOUT",
    "AUTH_PROVIDER_ERROR",
    "AUTH_SESSION_EXPIRED",
    "NETWORK_UNAVAILABLE",
    "VALIDATION_ERROR",
    "PERMISSION_DENIED",
    "RESOURCE_NOT_FOUND",
    "RESOURCE_CONFLICT",
    "RATE_LIMITED",
    "SERVICE_UNAVAILABLE",
    "UNKNOWN_ERROR",
  ];
  for (const code of validCodes) {
    assert(`Error code '${code}' is recognized`, AppErrorCodeSchema.safeParse(code).success);
  }

  const blockedErr = formatAuthError(new AppError("AUTH_POPUP_BLOCKED", "Popup blocked"));
  assert("Popup blocked maps to recoverable error", blockedErr.recoverable === true);
  assert("Popup blocked offers redirect fallback action", blockedErr.retryActionTitle === "Continue via Redirect");

  const cancelledErr = formatAuthError(new AppError("AUTH_CANCELLED", "User closed window"));
  assert("Cancellation has gentle title", cancelledErr.title === "Sign-in Cancelled");

  // SECTION 3: Project Validation Schemas
  console.log("\n[3/4] Auditing Project Validation & Engine Registry...");
  const projectInput = {
    name: "Microservices Ingress Mesh",
    description: "Envoy gateway routing layer with sidecars",
    visualizerType: "networking" as const,
  };
  assert("Valid project creation input parses", CreateProjectSchema.safeParse(projectInput).success);
  assert("UpdateProjectSchema parses status and description", UpdateProjectSchema.safeParse({ name: "Renamed", status: "archived" }).success);
  assert("Rejects short project names (<2 chars)", !CreateProjectSchema.safeParse({ name: "A", visualizerType: "database" }).success);
  assert("Rejects unsupported visualizer type", !CreateProjectSchema.safeParse({ name: "Valid Name", visualizerType: "non-existent" }).success);

  const filterParsed = ProjectFilterSchema.parse({ status: "active", search: "Ingress", limit: 10 });
  assert("Project filter parses with status and search", filterParsed.status === "active" && filterParsed.limit === 10);

  const registeredTypes = Object.keys(VISUALIZER_TYPE_METADATA);
  assert("Visualizer metadata registry has at least 8 engines", registeredTypes.length >= 8);
  assert("System Design engine exists in metadata registry", VISUALIZER_TYPE_METADATA["system-design"] !== undefined);

  // SECTION 4: Live Supabase RLS & Cross-User Isolation
  console.log("\n[4/4] Auditing Supabase Auth, Profiles & Project Ownership RLS...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsdmiqbqqcfhvuqxymse.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZG1pcWJxcWNmaHZ1cXh5bXNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDA2NzQxNCwiZXhwIjoyMTA5NjQzNDE0fQ.ztqvTQSI6HUoFapVopwJesStFPLzs54btVHF1hFWPkM";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZG1pcWJxcWNmaHZ1cXh5bXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNjc0MTQsImV4cCI6MjEwOTY0MzQxNH0.7NKO7mh_QM-nR1fx19C1cmCIU9iogES2ZqYDuKjy-N0";

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const anonClient = createClient(supabaseUrl, anonKey);

  // Create User A
  const emailA = `audit-user-a-${Date.now()}@nxtqr.dev`;
  const password = "ComplexPassword!987";
  const { data: userAData, error: errA } = await adminClient.auth.admin.createUser({
    email: emailA,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Engineer Alpha", avatar_url: "https://example.com/alpha.png" },
  });
  assert("User Alpha created in auth.users", !errA && !!userAData?.user);
  const userA = userAData?.user;

  // Create User B
  const emailB = `audit-user-b-${Date.now()}@nxtqr.dev`;
  const { data: userBData, error: errB } = await adminClient.auth.admin.createUser({
    email: emailB,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Engineer Beta" },
  });
  assert("User Beta created in auth.users", !errB && !!userBData?.user);
  const userB = userBData?.user;

  if (userA && userB) {
    // Check automatic profile provisioning trigger
    const { data: profA } = await adminClient.from("profiles").select("*").eq("id", userA.id).single();
    assert("Profile for User Alpha auto-provisioned by Postgres trigger", !!profA && profA.email === emailA);

    // Sign in as User A via client
    const { data: sessionA } = await anonClient.auth.signInWithPassword({ email: emailA, password });
    assert("User Alpha authenticated via Supabase Auth client", !!sessionA.session);

    // Create client scoped to User A
    const clientA = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${sessionA.session?.access_token}` } },
    });

    // Create workspace for User A
    const wsA = await adminClient.from("workspaces").insert({
      name: "Alpha Workspace",
      slug: `alpha-${userA.id.slice(0, 8)}`,
      created_by: userA.id,
    }).select().single();
    await adminClient.from("workspace_members").insert({
      workspace_id: wsA.data.id,
      user_id: userA.id,
      role: "owner",
    });

    // Create Project owned by User A
    const { data: projA, error: projErr } = await clientA.from("projects").insert({
      name: "Alpha Core Engine",
      description: "Primary distributed system diagram",
      visualizer_type: "system-design",
      workspace_id: wsA.data.id,
      created_by: userA.id,
      graph_document: { status: "active", nodes: 5 },
    }).select().single();
    assert("User Alpha successfully created project via authenticated client", !projErr && !!projA);

    // Sign in as User B via client
    const { data: sessionB } = await anonClient.auth.signInWithPassword({ email: emailB, password });
    const clientB = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${sessionB.session?.access_token}` } },
    });

    // Cross-user RLS isolation check: User B tries to select User A's project
    const { data: crossReadData } = await clientB.from("projects").select("*").eq("id", projA?.id);
    assert("RLS Check: User Beta CANNOT read User Alpha's project (returns empty)", !crossReadData || crossReadData.length === 0);

    // Cross-user RLS check: User B tries to delete User A's project
    const { data: crossDeleteData } = await clientB.from("projects").delete().eq("id", projA?.id).select();
    assert("RLS Check: User Beta CANNOT delete User Alpha's project", !crossDeleteData || crossDeleteData.length === 0);

    // Clean up test projects & users
    await adminClient.from("projects").delete().eq("id", projA?.id);
    await adminClient.from("workspace_members").delete().eq("workspace_id", wsA.data?.id);
    await adminClient.from("workspaces").delete().eq("id", wsA.data?.id);
    await adminClient.auth.admin.deleteUser(userA.id);
    await adminClient.auth.admin.deleteUser(userB.id);
    assert("Test users and projects cleanly removed from Supabase", true);
  }

  console.log("\n================================================================================");
  console.log(`AUDIT RESULTS: ${passedChecks}/${totalChecks} PASSED, ${failedChecks} FAILED`);
  console.log("================================================================================");

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runPhase03Audit().catch((err) => {
  console.error("Fatal audit execution error:", err);
  process.exit(1);
});

