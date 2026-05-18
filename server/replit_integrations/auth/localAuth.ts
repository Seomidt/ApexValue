import { createClient } from "@supabase/supabase-js";
import type { Express, RequestHandler } from "express";

const ADMIN_EMAILS = ["seomidt@gmail.com"];

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  // POST /api/logout — client handles the actual sign-out via Supabase SDK
  app.post("/api/logout", (_req, res) => {
    res.json({ ok: true });
  });

  // GET /api/logout — backwards compat redirect
  app.get("/api/logout", (_req, res) => {
    res.redirect("/");
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice(7);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isAdmin = !!(data.user.email && ADMIN_EMAILS.includes(data.user.email));

    (req as any).user = {
      claims: {
        sub: data.user.id,
        email: data.user.email,
      },
      isAdmin,
    };

    next();
  } catch (err) {
    console.error("[auth] JWT verification failed:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAdminUser: RequestHandler = (req, res, next) => {
  const user = (req as any).user;
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
