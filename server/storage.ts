import {
  type User, type UpsertUser,
  type Vehicle, type InsertVehicle,
  type MarketComp, type InsertMarketComp,
  type CostTemplate, type InsertCostTemplate,
  type Organization, type InsertOrganization,
  type Event, type InsertEvent,
  vehicles, marketComps, costTemplates, organizations, events,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { users } from "@shared/models/auth";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getVehicles(orgId?: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  getMarketComps(vehicleId: number): Promise<MarketComp[]>;
  createMarketComp(comp: InsertMarketComp): Promise<MarketComp>;

  getCostTemplates(orgId?: number): Promise<CostTemplate[]>;
  createCostTemplate(template: InsertCostTemplate): Promise<CostTemplate>;

  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;

  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return undefined;

    // Hardcoded admin list for security
    const adminEmails = ["seomidt@gmail.com"]; 
    const isHardcodedAdmin = user.email && adminEmails.includes(user.email);

    return { ...user, isAdmin: isHardcodedAdmin || false };
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getVehicles(orgId?: number): Promise<Vehicle[]> {
    if (orgId) {
      return db.select().from(vehicles).where(eq(vehicles.orgId, orgId)).orderBy(desc(vehicles.createdAt));
    }
    return db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [created] = await db.insert(vehicles).values(vehicle).returning();
    return created;
  }

  async updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [updated] = await db.update(vehicles).set({ ...data, updatedAt: new Date() }).where(eq(vehicles.id, id)).returning();
    return updated || undefined;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    await db.delete(marketComps).where(eq(marketComps.vehicleId, id));
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }

  async getMarketComps(vehicleId: number): Promise<MarketComp[]> {
    return db.select().from(marketComps).where(eq(marketComps.vehicleId, vehicleId));
  }

  async createMarketComp(comp: InsertMarketComp): Promise<MarketComp> {
    const [created] = await db.insert(marketComps).values(comp).returning();
    return created;
  }

  async getCostTemplates(orgId?: number): Promise<CostTemplate[]> {
    return db.select().from(costTemplates);
  }

  async createCostTemplate(template: InsertCostTemplate): Promise<CostTemplate> {
    const [created] = await db.insert(costTemplates).values(template).returning();
    return created;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.createdAt)).limit(100);
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
