// ─── Connector Registry ───────────────────────────────────────────────────────
// All connectors implement the same interface.
// V1: stubs + UI ready; V2/V3: real API calls when BYOK keys provided.

export interface ConnectorCredentials {
  apiKey?: string;
  apiSecret?: string;
  endpoint?: string;
}

export interface ConnectorStatus {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface VehicleData {
  vin?: string;
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  priceEur: number;
  description?: string;
  imageUrls?: string[];
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: 'auction' | 'market_data' | 'listing' | 'tax';
  docsUrl: string;
  init(creds: ConnectorCredentials): void;
  testConnection(): Promise<ConnectorStatus>;
  // Optional: implement in V2+
  fetchVehicles?(): Promise<VehicleData[]>;
  fetchComps?(make: string, model: string, year: number, market: string): Promise<VehicleData[]>;
}

// Stub base
class BaseConnector implements Connector {
  id = '';
  name = '';
  description = '';
  logoUrl = '/icons/connector-generic.svg';
  category: Connector['category'] = 'auction';
  docsUrl = '#';
  protected creds: ConnectorCredentials = {};

  init(creds: ConnectorCredentials) {
    this.creds = creds;
  }

  async testConnection(): Promise<ConnectorStatus> {
    if (!this.creds.apiKey) {
      return { ok: false, message: 'No API key configured' };
    }
    // Stub: always returns ok if key present
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, message: 'Connection stub – live test requires ENABLE_LIVE_MODE=true', latencyMs: 500 };
  }
}

export class Auto1Connector extends BaseConnector {
  id = 'auto1';
  name = 'Auto1 Group';
  description = 'Access Auto1 auction inventory via their partner API.';
  logoUrl = '/icons/auto1.svg';
  category: Connector['category'] = 'auction';
  docsUrl = 'https://www.auto1-group.com/';

  async fetchVehicles(): Promise<VehicleData[]> {
    if (process.env.ENABLE_LIVE_MODE !== 'true') return [];
    // TODO: implement real Auto1 API call in V2
    throw new Error('Live mode not implemented yet. Enable ENABLE_LIVE_MODE=true and configure keys.');
  }
}

export class MobileDeConnector extends BaseConnector {
  id = 'mobile_de';
  name = 'mobile.de';
  description = 'Fetch market comparables and price data from mobile.de.';
  logoUrl = '/icons/mobile-de.svg';
  category: Connector['category'] = 'market_data';
  docsUrl = 'https://services.mobile.de/';

  async fetchComps(make: string, model: string, year: number, market: string): Promise<VehicleData[]> {
    if (process.env.ENABLE_LIVE_MODE !== 'true') return [];
    throw new Error('Live mode not implemented yet.');
  }
}

export class BilinfoConnector extends BaseConnector {
  id = 'bilinfo';
  name = 'Bilinfo';
  description = 'Distribute vehicle listings to Bilinfo/DBA/AutoUncle network.';
  logoUrl = '/icons/bilinfo.svg';
  category: Connector['category'] = 'listing';
  docsUrl = 'https://www.bilinfo.net/';
}

export class ASGConnector extends BaseConnector {
  id = 'asg';
  name = 'ASG Digital';
  description = 'Calculate Danish registration tax (registreringsafgift) via ASG.';
  logoUrl = '/icons/asg.svg';
  category: Connector['category'] = 'tax';
  docsUrl = 'https://asg.dk/';

  async calculateTax(params: { vin?: string; vehicleValueDKK: number }) {
    if (process.env.ENABLE_LIVE_MODE !== 'true') return null;
    throw new Error('Live mode not implemented yet.');
  }
}

export const CONNECTORS: Connector[] = [
  new Auto1Connector(),
  new MobileDeConnector(),
  new BilinfoConnector(),
  new ASGConnector(),
];

export function getConnector(id: string): Connector | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export const CONNECTOR_META = [
  {
    id: 'auto1',
    name: 'Auto1 Group',
    description: 'Access auction inventory from Europe\'s largest used car platform.',
    category: 'Auction',
    status: 'stub',
    docsUrl: 'https://www.auto1-group.com/',
  },
  {
    id: 'mobile_de',
    name: 'mobile.de',
    description: 'Fetch market comparable prices from Germany\'s #1 car portal.',
    category: 'Market Data',
    status: 'stub',
    docsUrl: 'https://services.mobile.de/',
  },
  {
    id: 'bilinfo',
    name: 'Bilinfo',
    description: 'Distribute listings to DK\'s leading dealer network.',
    category: 'Listing',
    status: 'stub',
    docsUrl: 'https://www.bilinfo.net/',
  },
  {
    id: 'asg',
    name: 'ASG Digital',
    description: 'Official Danish registration tax calculation partner.',
    category: 'Tax',
    status: 'stub',
    docsUrl: 'https://asg.dk/',
  },
];
