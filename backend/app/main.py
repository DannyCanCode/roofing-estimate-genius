from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import pdf, estimate

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(pdf.router, prefix="/api", tags=["pdf"])
app.include_router(estimate.router, prefix="/api", tags=["estimate"])

@app.get("/")
async def root():
    return {"message": "Welcome to 3MG Roofing Estimator API"} 