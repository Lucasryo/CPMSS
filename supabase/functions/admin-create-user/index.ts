import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ALLOWED_ROLES = new Set([
  "admin",
  "client",
  "external_client",
  "reservations",
  "faturamento",
  "reception",
  "finance",
  "eventos",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Supabase function secrets are not configured." }, 500);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return json({ error: "Missing bearer token." }, 401);
    }

    const { data: userData, error: authError } = await adminClient.auth.getUser(jwt);
    if (authError || !userData.user) {
      return json({ error: "Invalid session." }, 401);
    }

    const callerId = userData.user.id;
    const { data: callerProfile, error: callerProfileError } = await adminClient
      .from("profiles")
      .select("id, role, permissions")
      .eq("id", callerId)
      .maybeSingle();

    if (callerProfileError) {
      return json({ error: callerProfileError.message }, 500);
    }

    const canCreateUsers =
      callerProfile?.role === "admin" ||
      callerProfile?.role === "faturamento" ||
      callerProfile?.permissions?.canCreateUsers === true;

    if (!canCreateUsers) {
      return json({ error: "You do not have permission to create users." }, 403);
    }

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const name = String(body?.name ?? "").trim();
    const role = String(body?.role ?? "client");
    const companyId = body?.company_id ?? body?.companyId ?? null;
    const permissions = body?.permissions ?? null;

    if (!email || !password || !name) {
      return json({ error: "Name, email and password are required." }, 400);
    }

    if (password.length < 6) {
      return json({ error: "Password must be at least 6 characters." }, 400);
    }

    if (!ALLOWED_ROLES.has(role)) {
      return json({ error: "Invalid role." }, 400);
    }

    const { data: createdUserData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        role,
      },
    });

    if (createUserError || !createdUserData.user) {
      return json({ error: createUserError?.message ?? "Failed to create auth user." }, 400);
    }

    const profilePayload = {
      id: createdUserData.user.id,
      name,
      email,
      role,
      company_id: companyId,
      permissions,
    };

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(createdUserData.user.id);
      return json({ error: profileError.message }, 500);
    }

    return json({
      success: true,
      user: {
        id: createdUserData.user.id,
        email,
        name,
        role,
        company_id: companyId,
        permissions,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
