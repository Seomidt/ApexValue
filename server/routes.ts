import type { Express, RequestHandler } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { seedDemoData } from "./seed";
import { insertVehicleSchema, insertCostTemplateSchema, insertEventSchema, VEHICLE_STATUSES } from "@shared/schema";

const isAdmin: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const dbUser = await storage.getUser(user.claims.sub);
  if (!dbUser?.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/vehicles", async (_req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const parsed = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(parsed);
      res.status(201).json(vehicle);
    } catch (error) {
      console.error("Error creating vehicle:", error);
      res.status(400).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.updateVehicle(id, req.body);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      res.status(400).json({ message: "Failed to update vehicle" });
    }
  });

  app.patch("/api/vehicles/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status || !VEHICLE_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const vehicle = await storage.updateVehicle(id, { status });
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json(vehicle);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(400).json({ message: "Failed to update status" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteVehicle(id);
      if (!result) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      res.json({ message: "Vehicle deleted" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  app.get("/api/vehicles/:id/comps", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const comps = await storage.getMarketComps(vehicleId);
      res.json(comps);
    } catch (error) {
      console.error("Error fetching comps:", error);
      res.status(500).json({ message: "Failed to fetch comps" });
    }
  });

  app.get("/api/cost-templates", async (_req, res) => {
    try {
      const templates = await storage.getCostTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching cost templates:", error);
      res.status(500).json({ message: "Failed to fetch cost templates" });
    }
  });

  app.post("/api/cost-templates", async (req, res) => {
    try {
      const parsed = insertCostTemplateSchema.parse(req.body);
      const template = await storage.createCostTemplate(parsed);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating cost template:", error);
      res.status(400).json({ message: "Failed to create cost template" });
    }
  });

  app.get("/api/events", async (_req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      const pipeline = vehicles.filter(v => v.status !== "sold");
      const hotDeals = vehicles.filter(v => (v.dealScore || 0) >= 70);
      const riskVehicles = vehicles.filter(v => (v.dealScore || 0) < 40);

      res.json({
        totalVehicles: vehicles.length,
        pipelineCount: pipeline.length,
        hotDealsCount: hotDeals.length,
        riskCount: riskVehicles.length,
        soldCount: vehicles.filter(v => v.status === "sold").length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/stats", isAdmin, async (_req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      const pipeline = vehicles.filter(v => v.status !== "sold");
      const hotDeals = vehicles.filter(v => (v.dealScore || 0) >= 70);
      const riskVehicles = vehicles.filter(v => (v.dealScore || 0) < 40);

      res.json({
        totalVehicles: vehicles.length,
        pipelineCount: pipeline.length,
        hotDealsCount: hotDeals.length,
        riskCount: riskVehicles.length,
        soldCount: vehicles.filter(v => v.status === "sold").length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const API_TEST_URLS: Record<string, { url: string; method: string; name: string }> = {
    MOBILE_DE: { url: "https://services.mobile.de/search-api/search", method: "HEAD", name: "mobile.de" },
    AUTOSCOUT24: { url: "https://api.autoscout24.com/", method: "HEAD", name: "AutoScout24" },
    BCA: { url: "https://www.bca.com/", method: "HEAD", name: "BCA Auctions" },
    AUTO1: { url: "https://www.auto1.com/", method: "HEAD", name: "Auto1 / wkda" },
    ASG: { url: "https://www.asgdigital.dk/", method: "HEAD", name: "ASG Digital" },
    DMR: { url: "https://motorregister.skat.dk/", method: "HEAD", name: "DMR API" },
    BILINFO: { url: "https://www.bilinfo.dk/", method: "HEAD", name: "Bilinfo" },
    R2: { url: "https://api.cloudflare.com/client/v4/", method: "HEAD", name: "Cloudflare R2" },
  };

  app.post("/api/connectors/test", async (req, res) => {
    try {
      const { connectorKey, apiKey, apiSecret } = req.body;
      if (!connectorKey || typeof connectorKey !== "string" || !apiKey || typeof apiKey !== "string") {
        return res.status(400).json({ success: false, message: "Connector-nøgle og API-nøgle er påkrævet." });
      }

      const allowedKeys = Object.keys(API_TEST_URLS);
      if (!allowedKeys.includes(connectorKey)) {
        return res.status(400).json({ success: false, message: "Ukendt connector." });
      }

      const testConfig = API_TEST_URLS[connectorKey];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(testConfig.url, {
          method: testConfig.method,
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "User-Agent": "ApexValue/1.0",
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status === 401 || response.status === 403) {
          return res.json({
            success: false,
            status: response.status,
            message: `Adgang nægtet — kontrollér dine ${testConfig.name} legitimationsoplysninger.`,
          });
        }

        return res.json({
          success: true,
          status: response.status,
          message: `${testConfig.name} svarer korrekt (HTTP ${response.status}). Forbindelse OK.`,
        });
      } catch (fetchError: any) {
        clearTimeout(timeout);
        if (fetchError.name === "AbortError") {
          return res.json({
            success: false,
            message: `Timeout — ${testConfig.name} svarede ikke inden for 8 sekunder.`,
          });
        }
        return res.json({
          success: false,
          message: `Kunne ikke nå ${testConfig.name}. Kontrollér netværk og nøgler.`,
        });
      }
    } catch (error) {
      console.error("Error testing connector:", error);
      res.status(500).json({ success: false, message: "Serverfejl under test af forbindelse." });
    }
  });

  await seedDemoData();

  return httpServer;
}
