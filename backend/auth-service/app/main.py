from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

# Import API routers
from app.api.endpoints import auth, users, roles, debug, parent

# Create FastAPI app
app = FastAPI(
    title="Auth Service",
    description="Servizio di autenticazione e gestione utenti per l'app educativa",
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
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles"])
app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])
app.include_router(parent.router, prefix="/auth/parent", tags=["Parent"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "auth-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
