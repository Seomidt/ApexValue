import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// Simple password hashing with Node's built-in crypto
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const hashCheck = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === hashCheck;
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
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

const ADMIN_EMAILS = ["seomidt@gmail.com"];

passport.serializeUser((user: any, cb) => cb(null, user.id));
passport.deserializeUser(async (id: string, cb) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return cb(null, false);
    cb(null, { ...user, isAdmin: !!(user.email && ADMIN_EMAILS.includes(user.email)) });
  } catch (e) {
    cb(e);
  }
});

passport.use(
  new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user || !user.passwordHash) return done(null, false, { message: "Invalid credentials" });
      if (!verifyPassword(password, user.passwordHash)) return done(null, false, { message: "Invalid credentials" });
      const isAdmin = !!(user.email && ADMIN_EMAILS.includes(user.email));
      return done(null, { ...user, isAdmin });
    } catch (e) {
      return done(e);
    }
  })
);

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Register
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    try {
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) return res.status(400).json({ message: "Email already registered" });
      const passwordHash = hashPassword(password);
      const isAdmin = ADMIN_EMAILS.includes(email);
      const [user] = await db.insert(users).values({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        isAdmin,
      }).returning();
      req.login({ ...user, isAdmin }, (err) => {
        if (err) return res.status(500).json({ message: "Login after register failed" });
        res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin });
      });
    } catch (e: any) {
      console.error("Register error:", e);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (err2) => {
        if (err2) return next(err2);
        res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin });
      });
    })(req, res, next);
  });

  // Logout
  app.get("/api/logout", (req, res) => {
    req.logout(() => res.redirect("/"));
  });

  app.post("/api/logout", (req, res) => {
    req.logout(() => res.json({ ok: true }));
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};

export function registerAuthRoutes(app: Express) {
  app.get("/api/auth/user", isAuthenticated, (req: any, res) => {
    const u = req.user;
    res.json({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, isAdmin: u.isAdmin, profileImageUrl: u.profileImageUrl });
  });
}
