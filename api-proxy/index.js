export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    try {
      const API_BASE = "http://56.228.32.209:8000";
      const targetUrl = `${API_BASE}${url.pathname}${url.search}`;

      console.log(`Proxying ${request.method} request to: ${targetUrl}`);

      // Create headers that mimic a regular browser request
      const headers = new Headers();
      headers.set(
        "User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );
      headers.set("Accept", "application/json, text/plain, */*");
      headers.set("Accept-Language", "en-US,en;q=0.9");
      headers.set("Accept-Encoding", "gzip, deflate");
      headers.set("Cache-Control", "no-cache");
      headers.set("Connection", "keep-alive");
      headers.set("Host", "56.228.32.209:8000");
      headers.set("Origin", "https://bee.juniorflamebet.workers.dev");
      headers.set("Referer", "https://bee.juniorflamebet.workers.dev/");

      // Copy Content-Type if present
      const contentType = request.headers.get("Content-Type");
      if (contentType) {
        headers.set("Content-Type", contentType);
      }

      // Copy Authorization if present
      const authorization = request.headers.get("Authorization");
      if (authorization) {
        headers.set("Authorization", authorization);
      }

      // Make the request to your API with Cloudflare bypass
      const apiResponse = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? await request.clone().arrayBuffer()
            : undefined,
        cf: {
          // Try to bypass some Cloudflare restrictions
          resolveOverride: "56.228.32.209",
        },
      });

      console.log(`API Response Status: ${apiResponse.status}`);

      // Get the response data
      const responseData = await apiResponse.arrayBuffer();

      // Create response headers with CORS
      const responseHeaders = new Headers();

      // Copy headers from API response
      for (const [key, value] of apiResponse.headers) {
        responseHeaders.set(key, value);
      }

      // Add CORS headers
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, PATCH, OPTIONS"
      );
      responseHeaders.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );

      return new Response(responseData, {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Proxy error:", error);

      return new Response(
        JSON.stringify({
          error: "Proxy Error",
          message: error.message,
          url: request.url,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
