from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import requests
from typing import List, Optional

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PitchDetail(BaseModel):
    pitch: str
    area: float

class RoofFacet(BaseModel):
    number: int
    area: float

class RoofMeasurements(BaseModel):
    total_area: float
    predominant_pitch: str
    ridges: float
    hips: float
    valleys: float
    rakes: float
    eaves: float
    flashing: float
    step_flashing: float
    pitch_details: List[PitchDetail]
    facets: List[RoofFacet]
    suggested_waste_percentage: float

class ProcessPdfRequest(BaseModel):
    file_url: str

def extract_measurements(text: str) -> RoofMeasurements:
    # Initialize measurements with default values
    measurements = {
        "total_area": 0.0,
        "predominant_pitch": "",
        "ridges": 0.0,
        "hips": 0.0,
        "valleys": 0.0,
        "rakes": 0.0,
        "eaves": 0.0,
        "flashing": 0.0,
        "step_flashing": 0.0,
        "pitch_details": [],
        "facets": [],
        "suggested_waste_percentage": 10.0  # Default waste percentage
    }
    
    # Extract total area
    area_match = re.search(r"Total Area:\s*([\d,]+(?:\.\d+)?)", text)
    if area_match:
        measurements["total_area"] = float(area_match.group(1).replace(",", ""))
    
    # Extract predominant pitch
    pitch_match = re.search(r"Predominant Pitch:\s*([\d/]+)", text)
    if pitch_match:
        measurements["predominant_pitch"] = pitch_match.group(1)
    
    # Extract length measurements
    length_patterns = {
        "ridges": r"Ridge Length:\s*([\d,]+(?:\.\d+)?)",
        "hips": r"Hip Length:\s*([\d,]+(?:\.\d+)?)",
        "valleys": r"Valley Length:\s*([\d,]+(?:\.\d+)?)",
        "rakes": r"Rake Length:\s*([\d,]+(?:\.\d+)?)",
        "eaves": r"Eave Length:\s*([\d,]+(?:\.\d+)?)",
        "flashing": r"Flashing Length:\s*([\d,]+(?:\.\d+)?)",
        "step_flashing": r"Step Flashing Length:\s*([\d,]+(?:\.\d+)?)"
    }
    
    for key, pattern in length_patterns.items():
        match = re.search(pattern, text)
        if match:
            measurements[key] = float(match.group(1).replace(",", ""))
    
    # Extract pitch details
    pitch_area_pattern = r"([\d/]+)\s*pitch\s*area:\s*([\d,]+(?:\.\d+)?)"
    pitch_matches = re.finditer(pitch_area_pattern, text, re.IGNORECASE)
    for match in pitch_matches:
        pitch = match.group(1)
        area = float(match.group(2).replace(",", ""))
        measurements["pitch_details"].append({
            "pitch": pitch,
            "area": area
        })
    
    # Extract facet details
    facet_pattern = r"Facet\s*(\d+)\s*area:\s*([\d,]+(?:\.\d+)?)"
    facet_matches = re.finditer(facet_pattern, text, re.IGNORECASE)
    for match in facet_matches:
        number = int(match.group(1))
        area = float(match.group(2).replace(",", ""))
        measurements["facets"].append({
            "number": number,
            "area": area
        })
    
    # Calculate suggested waste percentage based on complexity
    total_length = sum([
        measurements["ridges"],
        measurements["hips"],
        measurements["valleys"],
        measurements["rakes"],
        measurements["eaves"]
    ])
    
    # Adjust waste percentage based on roof complexity
    if total_length > 500:
        measurements["suggested_waste_percentage"] = 15.0
    elif total_length > 300:
        measurements["suggested_waste_percentage"] = 12.5
    else:
        measurements["suggested_waste_percentage"] = 10.0
    
    return RoofMeasurements(**measurements)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/process-pdf")
async def process_pdf(request: ProcessPdfRequest) -> RoofMeasurements:
    try:
        # Download the PDF file
        response = requests.get(request.file_url)
        response.raise_for_status()
        pdf_data = response.content
        
        # Open the PDF with PyMuPDF
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        
        # Extract text from all pages
        text = ""
        for page in doc:
            text += page.get_text()
        
        # Close the document
        doc.close()
        
        # Extract measurements from the text
        measurements = extract_measurements(text)
        return measurements
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 