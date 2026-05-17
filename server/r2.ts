import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

function extractBucketFromUrl(url: string): { baseUrl: string; bucketName: string } {
  const match = url.match(/^(https?:\/\/[^/]+\.r2\.cloudflarestorage\.com)\/?(.*)$/);
  if (match) {
    return { baseUrl: match[1], bucketName: match[2]?.replace(/\/$/, "") || "" };
  }
  return { baseUrl: url.replace(/\/$/, ""), bucketName: "" };
}

function getR2Config() {
  const rawEndpoint = R2_ENDPOINT || "";
  const rawBucket = process.env.R2_BUCKET || "";

  const parsedBucket = extractBucketFromUrl(rawBucket);
  const parsedEndpoint = extractBucketFromUrl(rawEndpoint);

  const finalBucket = parsedBucket.bucketName 
    || (rawBucket && !rawBucket.includes("/") && !rawBucket.includes("://") ? rawBucket : "")
    || parsedEndpoint.bucketName 
    || "";

  let endpoint = parsedBucket.baseUrl || parsedEndpoint.baseUrl || rawEndpoint.replace(/\/$/, "");

  if (!endpoint && R2_ACCOUNT_ID) {
    endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }

  return { endpoint, bucket: finalBucket };
}

export function isR2Configured(): boolean {
  const { bucket } = getR2Config();
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && bucket && (R2_ENDPOINT || R2_ACCOUNT_ID));
}

export function getR2Bucket(): string {
  return getR2Config().bucket;
}

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    if (!isR2Configured()) {
      throw new Error("Cloudflare R2 is not configured");
    }
    const { endpoint } = getR2Config();
    const finalEndpoint = endpoint || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    s3Client = new S3Client({
      region: "auto",
      endpoint: finalEndpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

export async function testR2Connection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getClient();
    const bucket = getR2Bucket();
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return { success: true, message: `Forbindelse til R2 bucket '${bucket}' OK.` };
  } catch (error: any) {
    const bucket = getR2Bucket();
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return { success: false, message: `R2 bucket '${bucket}' blev ikke fundet.` };
    }
    if (error.$metadata?.httpStatusCode === 403) {
      return { success: false, message: "Adgang nægtet — kontrollér dine R2 legitimationsoplysninger." };
    }
    return { success: false, message: `R2 fejl: ${error.message}` };
  }
}

export async function uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  return key;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
  }), { expiresIn });
}

export async function getUploadPresignedUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  return getSignedUrl(client, new PutObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
    ContentType: contentType,
  }), { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: getR2Bucket(),
    Key: key,
  }));
}

export async function listFiles(prefix?: string): Promise<{ key: string; size: number; lastModified: Date | undefined }[]> {
  const client = getClient();
  const result = await client.send(new ListObjectsV2Command({
    Bucket: getR2Bucket(),
    Prefix: prefix,
    MaxKeys: 100,
  }));
  return (result.Contents || []).map(obj => ({
    key: obj.Key || "",
    size: obj.Size || 0,
    lastModified: obj.LastModified,
  }));
}
