import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv } from "@/lib/env-server";

export function getFilebaseClient() {
  const endpoint = process.env.FILEBASE_ENDPOINT || "https://s3.filebase.com";
  const region = process.env.FILEBASE_REGION || "us-east-1";
  const accessKeyId = process.env.FILEBASE_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.FILEBASE_SECRET_ACCESS_KEY || "";
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Filebase credentials missing (FILEBASE_ACCESS_KEY_ID/FILEBASE_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function putObjectToFilebase(params: { bucket: string; key: string; body: Buffer; contentType?: string }) {
  const client = getFilebaseClient();
  await client.send(new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType || "application/octet-stream",
  }));
  // Attempt to read CID metadata back (for IPFS-enabled buckets)
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: params.bucket, Key: params.key }));
    const meta = (head.Metadata || {}) as Record<string, string>;
    const cid = meta["cid"] || meta["ipfs-hash"] || meta["ipfs_cid"] || null;
    return { cid };
  } catch {
    return { cid: null };
  }
}

export function buildGatewayUrl(cid: string) {
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || process.env.FILEBASE_GATEWAY || "https://ipfs.filebase.io";
  return `${gateway.replace(/\/$/, "")}/ipfs/${cid}`;
}

