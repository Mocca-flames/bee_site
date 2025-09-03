// api-proxy/index.js

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      // Your API base URL
      const API_BASE = 'http://56.228.32.209:8000';
      
      // Construct the target URL
      const targetUrl = `${API_BASE}${url.pathname}${url.search}`;
      
      console.log(`Proxying request to: ${targetUrl}`);

      // Prepare headers for the API request
      const headers = new Headers();
      
      // Copy relevant headers from the original request
      for (const [key, value] of request.headers) {
        // Skip headers that might cause issues
        if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
          headers.set(key, value);
        }
      }

      // Make the request to your API
      const apiResponse = await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined,
      });

      // Get the response data
      const responseData = await apiResponse.arrayBuffer();
      
      // Create response headers
      const responseHeaders = new Headers();
      
      // Copy headers from API response
      for (const [key, value] of apiResponse.headers) {
        responseHeaders.set(key, value);
      }
      
      // Add CORS headers
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      return new Response(responseData, {
        status: apiResponse.status,
        statusText: apiResponse.statusText,
        headers: responseHeaders,
      });

    } catch (error) {
      console.error('Proxy error:', error);
      
      return new Response(JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};