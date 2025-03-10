from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

# Import API routers
from app.api.endpoints import path_templates, paths

# Create FastAPI app
app = FastAPI(
    title="Path Service",
    description="Servizio di gestione percorsi educativi per l'app educativa",
    version="0.1.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",  # Frontend React
    "http://localhost:8000",  # API Gateway
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(path_templates.router, prefix="/api/path-templates", tags=["Path Templates"])
app.include_router(paths.router, prefix="/api/paths", tags=["Paths"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "path-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8003, reload=True)
