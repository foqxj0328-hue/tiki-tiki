const DOWNLOADS = new Map([
  ["neoforge-21.1.233-installer.jar", { asset: "/download-assets/neoforge-21.1.233-installer.jar", size: 6964847, etag: "311475C8315ED0BE6B5F1DBBF5A377B6C0976457C0BD5AA6D19B0FE25FD77148" }],
  ["Incendium_1.21.x_v5.4.4.jar", { asset: "/download-assets/mods/Incendium_1.21.x_v5.4.4.jar", size: 4267528, etag: "285A4F69FE2391F2175F7FC9316D727A39C79BDD214923C59284D569BCE656F4" }],
  ["jei-1.21.1-neoforge-19.25.0.322.jar", { asset: "/download-assets/mods/jei-1.21.1-neoforge-19.25.0.322.jar", size: 1505377, etag: "360D627C4C81F9EB42E0D1F316BAC66765596405790809CF64655BDEFC0B0307" }],
  ["journeymap-neoforge-1.21.1-6.0.0-beta.48.jar", { asset: "/download-assets/mods/journeymap-neoforge-1.21.1-6.0.0-beta.48.jar", size: 3482455, etag: "E9CC74571A48C11460D62F46E73A9B7105A58A91283609E41AC6EBADEB895B63" }],
  ["konkrete_neoforge_1.9.9_MC_1.21.jar", { asset: "/download-assets/mods/konkrete_neoforge_1.9.9_MC_1.21.jar", size: 618842, etag: "791C5538751DD3015EF3A2CE92D98719E1A28A48EBBD817B78506771256654CD" }],
  ["kubejs-neoforge-2101.7.2-build.368.jar", { asset: "/download-assets/mods/kubejs-neoforge-2101.7.2-build.368.jar", size: 2281720, etag: "28867299E7A9F02CFD74E34745FDBBB073FE4887FDDBC98FD6C1ED2E87B01482" }],
  ["lithostitched-neoforge-1.21.1-1.4.8.jar", { asset: "/download-assets/mods/lithostitched-neoforge-1.21.1-1.4.8.jar", size: 452131, etag: "8B1D2CF5197AD37D20F90B415DB50B90B82314FD9B906089CC9306FE43E6CB79" }],
  ["Pixelmon-1.21.1-9.3.16-universal.jar", { chunks: 19, chunkSize: 20971520, size: 394230428, etag: "636676FA2FD04AB569F6885BA2DF006D2F4BDC82E0A6025EFB6BA97F2BDF44F6" }],
  ["rhino-2101.2.7-build.85.jar", { asset: "/download-assets/mods/rhino-2101.2.7-build.85.jar", size: 882075, etag: "E0E9B0E78EDD380440266C0F4EA8D489DAC851EF075A4566A66A6DAE2F7BBB66" }],
  ["Structory_1.21.x_v1.3.10.jar", { asset: "/download-assets/mods/Structory_1.21.x_v1.3.10.jar", size: 1260786, etag: "50669B8AD823CB5FE5C29CA7ACB357B711E32068F29623E5A3E49B84CBFC0F47" }],
  ["Structory_Towers_1.21.x_v1.0.11.jar", { asset: "/download-assets/mods/Structory_Towers_1.21.x_v1.0.11.jar", size: 486375, etag: "B834131F2B77AAE72CFD78E6FD0D095CDA048F38681B5E812CD2768F336EAB32" }],
  ["tectonic-3.0.1-neoforge-1.21.1.jar", { asset: "/download-assets/mods/tectonic-3.0.1-neoforge-1.21.1.jar", size: 281066, etag: "E28F41AF629212483D21ABC11077DBB068A495D1D531927C8A7A832F9D1048BE" }],
  ["Terralith_1.21.x_v2.5.8.jar", { asset: "/download-assets/mods/Terralith_1.21.x_v2.5.8.jar", size: 3115385, etag: "00333A130AC38B7B9CA93700098D5E02E0612BDC2D3522AADA2F36E5600621BF" }]
]);

const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Resource-Policy": "same-origin"
};

function withSecurityHeaders(response) {
  const next = new Response(response.body, response);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => next.headers.set(key, value));
  return next;
}

function parseRange(rangeHeader, size) {
  if (!rangeHeader?.startsWith("bytes=")) return null;
  const [startText, endText] = rangeHeader.slice(6).split("-");
  let start;
  let end;

  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(startText);
    end = endText ? Number(endText) : size - 1;
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start > end || start >= size) {
    return null;
  }

  return { offset: start, length: Math.min(end, size - 1) - start + 1 };
}

async function serveDownload(request, env, filename) {
  const file = DOWNLOADS.get(filename);
  if (!file) return new Response("File not found", { status: 404 });

  const range = parseRange(request.headers.get("Range"), file.size);
  if (request.headers.has("Range") && !range) {
    return new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${file.size}` }
    });
  }

  const headers = new Headers({
    "Content-Type": "application/java-archive",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Accept-Ranges": "bytes",
    "ETag": `"${file.etag}"`,
    "Cache-Control": "public, max-age=86400, immutable",
    "X-Robots-Tag": "noindex"
  });

  const start = range?.offset ?? 0;
  const length = range?.length ?? file.size;
  const end = start + length - 1;
  headers.set("Content-Length", String(length));
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);

  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });

  if (file.asset) {
    const assetUrl = new URL(file.asset, request.url);
    const assetHeaders = new Headers();
    if (range) assetHeaders.set("Range", `bytes=${start}-${end}`);
    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, { headers: assetHeaders }));
    if (!assetResponse.ok && assetResponse.status !== 206) {
      return Response.json({ error: "download_not_ready" }, { status: 503 });
    }
    return new Response(assetResponse.body, { status: range ? 206 : 200, headers });
  }

  const firstChunk = Math.floor(start / file.chunkSize);
  const lastChunk = Math.floor(end / file.chunkSize);
  let chunkIndex = firstChunk;

  const body = new ReadableStream({
    async pull(controller) {
      if (chunkIndex > lastChunk) {
        controller.close();
        return;
      }
      const chunkUrl = new URL(`/download-assets/pixelmon/chunk-${String(chunkIndex).padStart(2, "0")}.bin`, request.url);
      const response = await env.ASSETS.fetch(chunkUrl);
      if (!response.ok) {
        controller.error(new Error("Download chunk unavailable"));
        return;
      }
      let bytes = new Uint8Array(await response.arrayBuffer());
      if (chunkIndex === firstChunk) bytes = bytes.slice(start % file.chunkSize);
      if (chunkIndex === lastChunk) {
        const expectedLength = end - chunkIndex * file.chunkSize + 1;
        bytes = bytes.slice(0, expectedLength - (chunkIndex === firstChunk ? start % file.chunkSize : 0));
      }
      controller.enqueue(bytes);
      chunkIndex += 1;
    }
  });

  return new Response(body, { status: range ? 206 : 200, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return withSecurityHeaders(Response.json({
        ok: true,
        service: "tiki-tiki",
        version: "1.21.1",
        timestamp: new Date().toISOString()
      }));
    }

    if (url.pathname.startsWith("/downloads/")) {
      if (!["GET", "HEAD"].includes(request.method)) {
        return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
      }
      const filename = decodeURIComponent(url.pathname.slice("/downloads/".length));
      return withSecurityHeaders(await serveDownload(request, env, filename));
    }

    if (url.pathname.startsWith("/download-assets/")) {
      return new Response("Not found", { status: 404 });
    }

    return withSecurityHeaders(await env.ASSETS.fetch(request));
  }
};
