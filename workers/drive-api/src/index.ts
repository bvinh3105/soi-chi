// ============================================================
// Sợi chỉ — Google Drive API Worker
// Cloudflare Worker làm cầu nối giữa web app và Google Drive
// ============================================================

interface Env {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  DRIVE_FOLDER_ID: string;
  API_SECRET: string;
  ALLOWED_ORIGIN: string;
}

// ============================================================
// Google Auth — JWT Service Account
// ============================================================

function base64url(data: ArrayBuffer | string): string {
  const str =
    typeof data === "string"
      ? btoa(data)
      : btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(data))));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}

async function getAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      scope: "https://www.googleapis.com/auth/drive",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(env.GOOGLE_PRIVATE_KEY),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Google auth failed: ${data.error}`);
  return data.access_token;
}

// ============================================================
// Google Drive API helpers
// ============================================================

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
}

async function uploadFile(
  token: string,
  file: File,
  folderId: string,
  subfolder?: string
): Promise<DriveFile> {
  // If subfolder specified, find or create it
  let targetFolderId = folderId;
  if (subfolder) {
    targetFolderId = await findOrCreateFolder(token, subfolder, folderId);
  }

  // Multipart upload (metadata + file content)
  const metadata = {
    name: file.name,
    parents: [targetFolderId],
  };

  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" })
  );
  form.append("file", file);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink,createdTime",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Drive upload failed: ${err}`);
  }

  const driveFile = (await res.json()) as DriveFile;

  // Make file publicly readable
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${driveFile.id}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "reader", type: "anyone" }),
    }
  );

  return driveFile;
}

async function findOrCreateFolder(
  token: string,
  name: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const q = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = (await searchRes.json()) as { files: { id: string }[] };

  if (searchData.files.length > 0) return searchData.files[0].id;

  // Create folder
  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    }),
  });
  const folder = (await createRes.json()) as { id: string };
  return folder.id;
}

async function deleteFile(token: string, fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`Drive delete failed: ${res.status}`);
  }
}

async function listFiles(
  token: string,
  folderId: string,
  subfolder?: string
): Promise<DriveFile[]> {
  let targetFolderId = folderId;

  if (subfolder) {
    const q = `name='${subfolder}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = (await searchRes.json()) as { files: { id: string }[] };
    if (data.files.length > 0) targetFolderId = data.files[0].id;
  }

  const q = `'${targetFolderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,thumbnailLink,createdTime)&orderBy=createdTime desc&pageSize=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = (await res.json()) as { files: DriveFile[] };
  return data.files;
}

// ============================================================
// Request handlers
// ============================================================

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ALLOWED_ORIGIN || "*";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // Public route: image proxy (cached by Cloudflare)
    if (url.pathname.startsWith("/img/")) {
      return handleImageProxy(url, origin);
    }

    // Protected routes — verify API secret
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.API_SECRET}`) {
      return json({ error: "Không có quyền truy cập" }, 401, origin);
    }

    try {
      const token = await getAccessToken(env);

      // POST /upload — upload file to Drive
      if (request.method === "POST" && url.pathname === "/upload") {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const subfolder = formData.get("folder") as string | null;

        if (!file) return json({ error: "Thiếu file" }, 400, origin);

        const driveFile = await uploadFile(
          token,
          file,
          env.DRIVE_FOLDER_ID,
          subfolder || undefined
        );

        // Return file info with proxy URL
        const proxyBase = url.origin;
        return json(
          {
            id: driveFile.id,
            name: driveFile.name,
            mimeType: driveFile.mimeType,
            url: `${proxyBase}/img/${driveFile.id}`,
            driveUrl: `https://drive.google.com/file/d/${driveFile.id}/view`,
            thumbnailUrl: driveFile.thumbnailLink || null,
          },
          200,
          origin
        );
      }

      // GET /files — list files
      if (request.method === "GET" && url.pathname === "/files") {
        const subfolder = url.searchParams.get("folder") || undefined;
        const files = await listFiles(token, env.DRIVE_FOLDER_ID, subfolder);

        const proxyBase = url.origin;
        return json(
          files.map((f) => ({
            id: f.id,
            name: f.name,
            mimeType: f.mimeType,
            size: f.size,
            url: `${proxyBase}/img/${f.id}`,
            createdTime: f.createdTime,
          })),
          200,
          origin
        );
      }

      // DELETE /file/:id — delete file
      if (request.method === "DELETE" && url.pathname.startsWith("/file/")) {
        const fileId = url.pathname.split("/file/")[1];
        if (!fileId) return json({ error: "Thiếu file ID" }, 400, origin);

        await deleteFile(token, fileId);
        return json({ ok: true }, 200, origin);
      }

      return json({ error: "Route không tồn tại" }, 404, origin);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return json({ error: message }, 500, origin);
    }
  },
};

// ============================================================
// Image proxy — public, cached by Cloudflare CDN
// ============================================================

async function handleImageProxy(
  url: URL,
  origin: string
): Promise<Response> {
  const fileId = url.pathname.split("/img/")[1];
  if (!fileId) {
    return json({ error: "Thiếu file ID" }, 400, origin);
  }

  // Fetch from Google Drive's direct download URL
  const driveUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

  const res = await fetch(driveUrl, {
    cf: {
      // Cache at Cloudflare edge for 7 days
      cacheTtl: 604800,
      cacheEverything: true,
    },
  });

  if (!res.ok) {
    return new Response("Không tìm thấy ảnh", { status: 404 });
  }

  // Return with cache headers
  const headers = new Headers(res.headers);
  headers.set("Cache-Control", "public, max-age=604800, immutable");
  headers.set("Access-Control-Allow-Origin", "*");
  // Remove Google's unwanted headers
  headers.delete("set-cookie");
  headers.delete("x-frame-options");

  return new Response(res.body, { status: 200, headers });
}
