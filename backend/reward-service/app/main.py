from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

# Import API routers
from app.api.endpoints import rewards, user_rewards, parent, templates

# Create FastAPI app
app = FastAPI(
    title="Reward Service",
    description="Servizio di gestione ricompense per l'app educativa",
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
app.include_router(rewards.router, prefix="/api/rewards", tags=["Rewards"])
app.include_router(user_rewards.router, prefix="/api/user-rewards", tags=["User Rewards"])
app.include_router(parent.router, prefix="/reward/parent", tags=["Parent Rewards"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "reward-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8004, reload=True)
