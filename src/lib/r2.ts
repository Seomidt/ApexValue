// ─── Cloudflare R2 Integration (feature-flagged) ──────────────────────────────
// App runs fully without R2 in demo/dev mode.

const R2_ENABLED = process.env.ENABLE_R2 === 'true' &&
  !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_BUCKET);

export function isR2Enabled(): boolean {
  return R2_ENABLED;
}

// Key naming convention: org/{orgId}/vehicle/{vehicleId}/{type}/filename
export function buildR2Key(orgId: string, vehicleId: string, type: 'images' | 'docs' | 'reports', filename: string): string {
  return `org/${orgId}/vehicle/${vehicleId}/${type}/${filename}`;
}

// Presigned upload URL (server-side, short-lived)
export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string | null> {
  if (!R2_ENABLED) return null;
  // In production: use @aws-sdk/s3-request-presigner with S3Client pointing to R2 endpoint
  // Stubbed here; implement when R2 env vars are present
  return `https://${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}?stub=presigned`;
}

// Presigned download URL
export async function getPresignedDownloadUrl(key: string, expiresIn = 300): Promise<string | null> {
  if (!R2_ENABLED) return null;
  return `https://${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}?stub=download&expires=${expiresIn}`;
}

// Delete object from R2
export async function deleteR2Object(key: string): Promise<boolean> {
  if (!R2_ENABLED) return false;
  // Implement with S3Client in production
  return false;
}

// Storage quota by plan (in bytes)
export const STORAGE_QUOTAS: Record<string, number> = {
  free: 1 * 1024 * 1024 * 1024, // 1 GB
  pro: 50 * 1024 * 1024 * 1024, // 50 GB
  team: 200 * 1024 * 1024 * 1024, // 200 GB
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
