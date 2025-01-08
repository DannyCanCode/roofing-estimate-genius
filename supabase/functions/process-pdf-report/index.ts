// deno-lint-ignore-file no-explicit-any

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { PDFDocument } from "https://deno.land/x/pdf@v0.3.0/mod.ts";
import { EagleViewParser } from "./extractors/eagleview-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, Content-Type, X-Client-Info",
  "Access-Control-Max-Age": "86400",
  "Access-Control-Expose-Headers": "content-length, content-type",
};

serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders,
          "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
        }
      });
    }

    if (req.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Starting PDF processing...");
    
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { fileUrl } = body;

    if (!fileUrl) {
      console.error("No file URL provided");
      return new Response(
        JSON.stringify({ error: "No file URL provided" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching PDF from URL:", fileUrl);
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    console.log("Loading PDF with PDFDocument...");
    const pdfDoc = await PDFDocument.load(new Uint8Array(arrayBuffer));

    let fullText = "";

    console.log(`PDF loaded, total pages: ${pdfDoc.getPageCount()}`);

    for (let pageNum = 0; pageNum < pdfDoc.getPageCount(); pageNum++) {
      const page = pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items.map((item: any) => item.str).join(" ");

      fullText += pageText + "\n";
    }

    console.log("Extracted text length:", fullText.length);
    console.log("Sample text:", fullText.substring(0, 500));

    const parser = new EagleViewParser();
    const measurements = parser.parseMeasurements(fullText);
    console.log("Parsed measurements:", measurements);

    if (!measurements.total_area) {
      console.error("No total area found in measurements");
      return new Response(
        JSON.stringify({
          error:
            "Could not extract roof area from PDF. Please ensure this is an EagleView report.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        measurements,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error processing request",
        details: error.toString(),
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
