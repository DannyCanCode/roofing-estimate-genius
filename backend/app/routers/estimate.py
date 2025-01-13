from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO

router = APIRouter()

class MaterialCost(BaseModel):
    shingles: float
    underlayment: float
    starter: float
    ridge_caps: float
    drip_edge: float
    ice_water: float
    total: float

class LaborCost(BaseModel):
    base: float
    steep_slope: float
    total: float

class EstimateCosts(BaseModel):
    materials: MaterialCost
    labor: LaborCost
    total: float

class PricingItem(BaseModel):
    price: float
    unit: str

class MaterialsPricing(BaseModel):
    shingles: PricingItem
    underlayment: PricingItem
    starter: PricingItem
    ridge_caps: PricingItem
    drip_edge: PricingItem
    ice_water: PricingItem

class LaborPricing(BaseModel):
    base_installation: PricingItem
    steep_slope_factor: PricingItem
    waste_factor: float

class PricingConfig(BaseModel):
    materials: MaterialsPricing
    labor: LaborPricing

class EstimateRequest(BaseModel):
    measurements: Dict[str, Any]
    pricing: PricingConfig
    selected_shingle: str
    costs: EstimateCosts

@router.post("/generate-estimate")
async def generate_estimate(request: EstimateRequest) -> bytes:
    """Generate a PDF estimate based on measurements and pricing."""
    try:
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = styles['Heading1']
        heading_style = styles['Heading2']
        normal_style = styles['Normal']
        
        # Create custom style for company info
        company_style = ParagraphStyle(
            'CompanyStyle',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=30
        )
        
        # Build document content
        content = []
        
        # Add header
        content.append(Paragraph("3MG Roofing Estimate", title_style))
        content.append(Spacer(1, 12))
        
        # Add company info
        content.append(Paragraph("3MG Roofing<br/>Professional Roofing Services<br/>Phone: (555) 123-4567<br/>Email: info@3mgroofing.com", company_style))
        
        # Add measurements section
        content.append(Paragraph("Roof Measurements", heading_style))
        content.append(Spacer(1, 12))
        
        measurements_data = [
            ["Total Area", f"{request.measurements['total_area']} sq ft"],
            ["Total Squares", f"{request.measurements['total_squares']}"],
            ["Predominant Pitch", request.measurements['predominant_pitch']],
            ["Penetrations Area", f"{request.measurements['penetrations_area']} sq ft"],
        ]
        
        measurements_table = Table(measurements_data, colWidths=[2*inch, 2*inch])
        measurements_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        content.append(measurements_table)
        content.append(Spacer(1, 20))
        
        # Add materials section
        content.append(Paragraph("Materials", heading_style))
        content.append(Spacer(1, 12))
        
        materials_data = [
            ["Item", "Cost"],
            ["GAF Shingles", f"${request.costs.materials.shingles:.2f}"],
            ["Underlayment", f"${request.costs.materials.underlayment:.2f}"],
            ["Starter Strip", f"${request.costs.materials.starter:.2f}"],
            ["Ridge Caps", f"${request.costs.materials.ridge_caps:.2f}"],
            ["Drip Edge", f"${request.costs.materials.drip_edge:.2f}"],
            ["Ice & Water Shield", f"${request.costs.materials.ice_water:.2f}"],
            ["Total Materials", f"${request.costs.materials.total:.2f}"],
        ]
        
        materials_table = Table(materials_data, colWidths=[3*inch, 2*inch])
        materials_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        content.append(materials_table)
        content.append(Spacer(1, 20))
        
        # Add labor section
        content.append(Paragraph("Labor", heading_style))
        content.append(Spacer(1, 12))
        
        labor_data = [
            ["Item", "Cost"],
            ["Base Installation", f"${request.costs.labor.base:.2f}"],
            ["Steep Slope Charge", f"${request.costs.labor.steep_slope:.2f}"],
            ["Total Labor", f"${request.costs.labor.total:.2f}"],
        ]
        
        labor_table = Table(labor_data, colWidths=[3*inch, 2*inch])
        labor_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ]))
        content.append(labor_table)
        content.append(Spacer(1, 20))
        
        # Add total
        content.append(Paragraph("Total Estimate", heading_style))
        content.append(Spacer(1, 12))
        
        total_data = [
            ["Item", "Cost"],
            ["Materials", f"${request.costs.materials.total:.2f}"],
            ["Labor", f"${request.costs.labor.total:.2f}"],
            ["Total", f"${request.costs.total:.2f}"],
        ]
        
        total_table = Table(total_data, colWidths=[3*inch, 2*inch])
        total_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BACKGROUND', (-1, -1), (-1, -1), colors.lightgrey),
        ]))
        content.append(total_table)
        
        # Build PDF
        doc.build(content)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate estimate: {str(e)}") 