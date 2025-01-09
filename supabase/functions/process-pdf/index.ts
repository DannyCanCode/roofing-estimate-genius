// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Force immediate log flush
console.log("Edge Function starting up...");
Deno.stdout.write(new TextEncoder().encode("Edge Function initialized\n"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

function logMessage(type: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = data ? `${JSON.stringify(data, null, 2)}` : '';
  const logMessage = `[${timestamp}] [${type}] ${message} ${logData}`;
  
  // Use both console.log and Deno.stdout for maximum logging coverage
  console.log(logMessage);
  Deno.stdout.write(new TextEncoder().encode(logMessage + "\n"));
}

serve(async (req) => {
  logMessage("INFO", "Request received", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    logMessage("INFO", "Handling CORS preflight");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const text = await req.text();
    logMessage("INFO", "Request body received", { body: text });

    let body;
    try {
      body = JSON.parse(text);
      logMessage("INFO", "Request body parsed", { body });
    } catch (parseError) {
      logMessage("ERROR", "Failed to parse request body", {
        message: parseError.message,
        stack: parseError.stack,
        name: parseError.name
      });
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON in request body',
          details: parseError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!body.fileUrl) {
      logMessage("ERROR", "No fileUrl provided in request body");
      return new Response(
        JSON.stringify({
          error: 'Missing fileUrl in request body',
          receivedBody: body
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return dummy measurements for testing
    const measurements = {
      total_area: 2500,
      predominant_pitch: "4/12",
      suggested_waste_percentage: 15
    };

    logMessage("INFO", "Returning measurements", { measurements });

    return new Response(
      JSON.stringify({ measurements }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    logMessage("ERROR", "Error occurred", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        type: error.name
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 