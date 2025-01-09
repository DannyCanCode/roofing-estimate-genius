/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json"
};

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
  console.log(`[${timestamp}] ${logMessage}`);
}

function extractPathFromUrl(url: string): string {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);
    // Split the pathname by segments
    const segments = parsedUrl.pathname.split('/');
    // Find the index of 'public' and get everything after it
    const publicIndex = segments.indexOf('public');
    if (publicIndex === -1) {
      throw new Error('Invalid storage URL format');
    }
    // Join the remaining segments
    return segments.slice(publicIndex + 2).join('/');
  } catch (error) {
    log("Error extracting path", { error, url });
    throw new Error(`Invalid file URL format: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fileUrl } = await req.json();
    log("Received request", { fileUrl });
    
    if (!fileUrl) {
      return new Response(
        JSON.stringify({ error: "Missing fileUrl in request" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract the path from the URL
    const filePath = extractPathFromUrl(fileUrl);
    log("Extracted file path", { filePath });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    log("Fetching file from storage", { filePath });

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseClient
      .storage
      .from('eagleview-reports')
      .download(filePath);

    if (downloadError) {
      log("Error downloading file", { error: downloadError });
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    if (!fileData) {
      throw new Error("No file data received");
    }

    log("File downloaded successfully", { size: fileData.size });

    // Convert blob to text
    const text = await fileData.text();
    log("Text extracted", { 
      length: text.length,
      sample: text.substring(0, 200)
    });

    // Extract measurements using regex
    const measurements = {
      total_area: 0,
      predominant_pitch: "4/12",
      suggested_waste_percentage: 15
    };

    // Look for total area
    const areaPatterns = [
      /Total\s+Area[:\s]+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      /Total\s+Roof\s+Area[:\s]+(\d+(?:,\d{3})*(?:\.\d+)?)/i,
      /(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:sq\.?\s*ft\.?|SF)\b/i
    ];

    for (const pattern of areaPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(value) && value > 0) {
          measurements.total_area = value;
          log("Found total area", { value, pattern: pattern.toString() });
          break;
        }
      }
    }

    // Look for pitch
    const pitchPatterns = [
      /Predominant\s+Pitch[:\s]+(\d+\/\d+)/i,
      /Main\s+Pitch[:\s]+(\d+\/\d+)/i,
      /Pitch[:\s]+(\d+\/\d+)/i
    ];

    for (const pattern of pitchPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        measurements.predominant_pitch = match[1];
        log("Found pitch", { value: match[1], pattern: pattern.toString() });
        break;
      }
    }

    if (!measurements.total_area) {
      log("No total area found in text");
      return new Response(
        JSON.stringify({ 
          error: "Could not find total area in PDF",
          details: "Please ensure this is a valid EagleView report"
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    log("Measurements extracted successfully", { measurements });
    return new Response(
      JSON.stringify({ measurements }),
      { headers: corsHeaders }
    );

  } catch (error) {
    log("Error processing PDF", { 
      error: error.message,
      stack: error.stack
    });
    return new Response(
      JSON.stringify({ 
        error: "Failed to process PDF",
        details: error.message 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}); 