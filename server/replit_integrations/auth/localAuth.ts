import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import { db } from "../../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const ADMIN_EMAILS = ["seomidt@gmail.com"];

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(derived, "hex"),
    Buffer.from(storedHash, "hex")
  );
}

function makeSessionUser(user: { id: string; email: string | null }) {
  return {
    claims: { sub: user.id, email: user.email },
    expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (!user || !user.passwordHash) {
            return done(null, false, { message: "Invalid credentials" });
          }

          const parts = user.passwordHash.split(":");
          if (parts.length !== 2) {
            return done(null, false, { message: "Invalid credentials" });
          }

          const [hash, salt] = parts;
          const valid = verifyPassword(password, hash, salt);
          if (!valid) {
            return done(null, false, { message: "Invalid credentials" });
          }

          return done(null, makeSessionUser(user));
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, cb) => cb(null, user.claims.sub));

  passport.deserializeUser(async (id: string, cb) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return cb(null, false);
      cb(null, makeSessionUser(user));
    } catch (err) {
      cb(err);
    }
  });

  // Seed admin user from env vars on startup
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    try {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = hashPassword(process.env.ADMIN_PASSWORD, salt);
      const passwordHash = `${hash}:${salt}`;
      const isAdmin = ADMIN_EMAILS.includes(process.env.ADMIN_EMAIL);

      await db
        .insert(users)
        .values({
          email: process.env.ADMIN_EMAIL,
          firstName: "Admin",
          isAdmin,
          passwordHash,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: { passwordHash, isAdmin },
        });

      console.log(`[auth] Admin user seeded: ${process.env.ADMIN_EMAIL}`);
    } catch (err) {
      console.error("[auth] Failed to seed admin user:", err);
    }
  }

  // POST /api/login — email + password
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res
          .status(401)
          .json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({
          ok: true,
          user: { id: user.claims.sub, email: user.claims.email },
        });
      });
    })(req, res, next);
  });

  // GET /api/logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
