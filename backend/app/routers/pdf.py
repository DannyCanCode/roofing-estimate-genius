from fastapi import APIRouter, UploadFile, HTTPException
from loguru import logger
from ..services.pdf_extractor import PDFExtractor

router = APIRouter()
pdf_extractor = PDFExtractor()

@router.post("/process-pdf")
async def process_pdf(file: UploadFile):
    """Process uploaded PDF and extract measurements."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        contents = await file.read()
        measurements = pdf_extractor.extract_measurements(contents)
        return measurements
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    finally:
        await file.close() 