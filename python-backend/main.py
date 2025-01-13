from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import fitz  # PyMuPDF
import camelot
import tempfile
import os
from typing import List, Optional, Dict, Any
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    debug_info: Optional[Dict[str, Any]] = None

def extract_measurements_camelot(pdf_path: str) -> RoofMeasurements:
    measurements = {
        "total_area": 0.0,
        "total_squares": 0.0,
        "predominant_pitch": "",
        "penetrations_area": 0.0,
        "penetrations_perimeter": 0.0,
        "ridges": 0.0,
        "hips": 0.0,
        "valleys": 0.0,
        "rakes": 0.0,
        "eaves": 0.0,
        "flashing": 0.0,
        "step_flashing": 0.0,
        "pitch_details": [],
        "facets": [],
        "suggested_waste_percentage": 10.0,
        "debug_info": {
            "extraction_method": "camelot",
            "tables_found": 0,
            "parsed_data": []
        }
    }

    patterns = {
        'total_area': r'Total\s*Area\s*(?:\(All\s*Pitches\)|=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|square\s*feet)',
        'total_squares': r'Squares\s*\*?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)',
        'predominant_pitch': r'(?:The\s+)?[Pp]redominant\s+[Pp]itch\s*(?:=|:)?\s*(\d+/\d+)',
        'areas_per_pitch': r'(\d+/\d+)\s+([\d,.]+)\s+(?:sq\.?\s*ft\.?)?\s*([\d.]+)%',
        'ridges': r'Ridges?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Ridges?)?\)',
        'valleys': r'Valleys?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Valleys?)?\)',
        'eaves': r'Eaves?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)(?:\s*\((\d+)\s*(?:Lengths?|Eaves?)?\))?',
        'rakes': r'Rakes?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)(?:\s*\((\d+)\s*(?:Lengths?|Rakes?)?\))?',
        'hips': r'Hips?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Hips?)?\)',
        'flashing': r'Flashing\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Lengths?|Pieces?)?\)',
        'step_flashing': r'Step\s+[Ff]lashing\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Lengths?|Pieces?)?\)',
        'penetrations': r'Total\s+Penetrations\s*=\s*(\d+)',
        'penetrations_area': r'Total\s+Penetrations?\s+Area\s*=\s*(\d+)\s*(?:sq\.?\s*ft|square\s*feet)',
        'penetrations_perimeter': r'Total\s+Penetrations?\s+Perimeter\s*=\s*(\d+)\s*(?:ft|feet)',
        'waste_percentage': r'(?:Suggested|Waste)\s*(?:Waste:?)?\s*=\s*(\d+(?:\.\d+)?)%'
    }

    try:
        logger.info("Starting Camelot extraction...")
        
        # Try lattice mode first
        logger.info("Attempting lattice mode extraction...")
        tables = camelot.read_pdf(pdf_path, pages='all', flavor='lattice')
        
        if len(tables) == 0:
            logger.info("No tables found in lattice mode, trying stream mode...")
            # If no tables found, try stream mode
            tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')

        measurements['debug_info']['tables_found'] = len(tables)
        logger.info(f"Found {len(tables)} tables")

        # Process each table
        for table_idx, table in enumerate(tables):
            df = table.df
            table_data = []
            
            # Process each row in the table
            for _, row in df.iterrows():
                row_text = ' '.join(str(cell) for cell in row)
                table_data.append(row_text)
                
                # Try to match patterns in the row text
                for key, pattern in patterns.items():
                    matches = list(re.finditer(pattern, row_text, re.IGNORECASE))
                    if matches:
                        if key == 'areas_per_pitch':
                            areas = measurements.get('areas_per_pitch', [])
                            for match in matches:
                                pitch, area, percentage = match.groups()
                                areas.append({
                                    'pitch': pitch,
                                    'area': float(area.replace(',', '')),
                                    'percentage': float(percentage)
                                })
                            measurements['areas_per_pitch'] = areas
                        elif key in ['ridges', 'valleys', 'eaves', 'rakes', 'hips', 'flashing', 'step_flashing']:
                            match = matches[0]
                            length = float(match.group(1).replace(',', ''))
                            count = int(match.group(2)) if match.group(2) else 1
                            measurements[key] = length
                            measurements['length_measurements'] = measurements.get('length_measurements', {})
                            measurements['length_measurements'][key] = {
                                'length': length,
                                'count': count
                            }
                        else:
                            match = matches[0]
                            value = match.group(1).replace(',', '')
                            measurements[key] = float(value) if '.' in value else int(value)

            measurements['debug_info']['parsed_data'].append({
                'table_index': table_idx,
                'rows': table_data
            })

        # Extract pitch details from areas_per_pitch
        if measurements.get('areas_per_pitch'):
            measurements['pitch_details'] = [
                {'pitch': area['pitch'], 'area': area['area']}
                for area in measurements['areas_per_pitch']
            ]

        # Calculate suggested waste percentage based on complexity
        total_length = sum([
            measurements.get('ridges', 0),
            measurements.get('hips', 0),
            measurements.get('valleys', 0),
            measurements.get('rakes', 0),
            measurements.get('eaves', 0)
        ])
        
        if total_length > 500:
            measurements['suggested_waste_percentage'] = 15.0
        elif total_length > 300:
            measurements['suggested_waste_percentage'] = 12.5
        else:
            measurements['suggested_waste_percentage'] = 10.0

        logger.info("Camelot extraction completed successfully")
        return RoofMeasurements(**measurements)
    
    except Exception as e:
        logger.error(f"Error in Camelot extraction: {str(e)}")
        measurements['debug_info']['error'] = str(e)
        # Fallback to PyMuPDF if Camelot fails
        return extract_measurements_pymupdf(pdf_path)

def extract_measurements_pymupdf(pdf_path: str) -> RoofMeasurements:
    measurements = {
        "total_area": 0.0,
        "total_squares": 0.0,
        "predominant_pitch": "",
        "penetrations_area": 0.0,
        "penetrations_perimeter": 0.0,
        "ridges": 0.0,
        "hips": 0.0,
        "valleys": 0.0,
        "rakes": 0.0,
        "eaves": 0.0,
        "flashing": 0.0,
        "step_flashing": 0.0,
        "pitch_details": [],
        "facets": [],
        "suggested_waste_percentage": 10.0,
        "debug_info": {
            "extraction_method": "pymupdf",
            "extracted_text": "",
            "matches_found": {}
        }
    }

    patterns = {
        'total_area': r'Total\s*Area\s*(?:\(All\s*Pitches\)|=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|square\s*feet)',
        'total_squares': r'Squares\s*\*?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)',
        'predominant_pitch': r'(?:The\s+)?[Pp]redominant\s+[Pp]itch\s*(?:=|:)?\s*(\d+/\d+)',
        'areas_per_pitch': r'(\d+/\d+)\s+([\d,.]+)\s+(?:sq\.?\s*ft\.?)?\s*([\d.]+)%',
        'ridges': r'Ridges?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Ridges?)?\)',
        'valleys': r'Valleys?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Valleys?)?\)',
        'eaves': r'Eaves?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)(?:\s*\((\d+)\s*(?:Lengths?|Eaves?)?\))?',
        'rakes': r'Rakes?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)(?:\s*\((\d+)\s*(?:Lengths?|Rakes?)?\))?',
        'hips': r'Hips?\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Hips?)?\)',
        'flashing': r'Flashing\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Lengths?|Pieces?)?\)',
        'step_flashing': r'Step\s+[Ff]lashing\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)\s*\((\d+)\s*(?:Lengths?|Pieces?)?\)',
        'penetrations': r'(?:Total\s+)?Penetrations?\s*(?:Count)?(?:=|:)?\s*(\d+)',
        'penetrations_area': r'(?:Total\s+)?Penetrations?\s+Area\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:sq\.?\s*ft|square\s*feet)',
        'penetrations_perimeter': r'(?:Total\s+)?Penetrations?\s+Perimeter\s*(?:=|:)?\s*([\d,]+(?:\.\d+)?)\s*(?:ft|feet)',
        'waste_percentage': r'(?:Suggested|Waste)\s*(?:Waste:?)?\s*=\s*(\d+(?:\.\d+)?)%'
    }

    try:
        logger.info("Starting PyMuPDF extraction...")
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()

        measurements['debug_info']['extracted_text'] = text[:1000]  # First 1000 chars for debugging

        # Extract measurements using patterns
        for key, pattern in patterns.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                if key == 'areas_per_pitch':
                    areas = []
                    for match in matches:
                        pitch, area, percentage = match.groups()
                        try:
                            areas.append({
                                'pitch': pitch,
                                'area': float(area.replace(',', '')),
                                'percentage': float(percentage)
                            })
                        except ValueError as e:
                            logger.warning(f"Failed to parse area or percentage for pitch {pitch}: {e}")
                            continue
                    measurements['areas_per_pitch'] = areas
                    measurements['debug_info']['matches_found'][key] = [m.group(0) for m in matches]
                elif key in ['ridges', 'valleys', 'eaves', 'rakes', 'hips', 'flashing', 'step_flashing']:
                    match = matches[0]
                    try:
                        length = float(match.group(1).replace(',', ''))
                        count = int(match.group(2)) if match.group(2) else 1
                        measurements[key] = length
                        measurements['length_measurements'] = measurements.get('length_measurements', {})
                        measurements['length_measurements'][key] = {
                            'length': length,
                            'count': count
                        }
                        measurements['debug_info']['matches_found'][key] = match.group(0)
                    except ValueError as e:
                        logger.warning(f"Failed to parse length measurement for {key}: {e}")
                        continue
                elif key == 'predominant_pitch':
                    match = matches[0]
                    measurements[key] = match.group(1)  # Store pitch as string, don't convert to int
                    measurements['debug_info']['matches_found'][key] = match.group(0)
                elif key in ['penetrations', 'penetrations_area', 'penetrations_perimeter']:
                    match = matches[0]
                    try:
                        value = match.group(1).replace(',', '')
                        measurements[key] = float(value)
                        measurements['debug_info']['matches_found'][key] = match.group(0)
                    except ValueError as e:
                        logger.warning(f"Failed to parse value for {key}: {e}")
                        continue
                else:
                    match = matches[0]
                    try:
                        value = match.group(1).replace(',', '')
                        measurements[key] = float(value) if '.' in value else float(value)  # Convert all numeric values to float
                        measurements['debug_info']['matches_found'][key] = match.group(0)
                    except ValueError as e:
                        logger.warning(f"Failed to parse value for {key}: {e}")
                        continue

        # Extract pitch details from areas_per_pitch
        if measurements.get('areas_per_pitch'):
            measurements['pitch_details'] = [
                {'pitch': area['pitch'], 'area': area['area']}
                for area in measurements['areas_per_pitch']
            ]

        logger.info("PyMuPDF extraction completed successfully")
        return RoofMeasurements(**measurements)
    except Exception as e:
        logger.error(f"Failed to extract measurements with PyMuPDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract measurements: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    try:
        logger.info(f"Processing uploaded file: {file.filename}")
        
        # Create a temporary file to store the uploaded PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file.flush()
            logger.info(f"Saved uploaded file to temporary location: {temp_file.name}")
            
            try:
                # Try Camelot first
                measurements = extract_measurements_camelot(temp_file.name)
            except Exception as camelot_error:
                logger.error(f"Camelot extraction failed: {str(camelot_error)}")
                # If Camelot fails, try PyMuPDF
                measurements = extract_measurements_pymupdf(temp_file.name)
            
            # Clean up the temporary file
            os.unlink(temp_file.name)
            
            return measurements
            
    except Exception as e:
        logger.error(f"Failed to process PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001) 