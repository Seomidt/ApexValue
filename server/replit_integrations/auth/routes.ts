import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./localAuth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // GET /api/auth/user — returns current user, auto-creating DB record if needed
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const { sub: id, email } = req.user.claims;

      // Try to find existing DB user
      let user = await authStorage.getUser(id);

      // First-time login: create the DB record using Supabase user ID
      if (!user) {
        user = await authStorage.upsertUser({
          id,
          email,
          isAdmin: req.user.isAdmin,
        });
      }

      res.json({ ...user, isAdmin: req.user.isAdmin });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
}
