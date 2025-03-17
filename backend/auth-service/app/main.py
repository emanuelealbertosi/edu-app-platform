from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import os
import socket

# Import API routers
from app.api.endpoints import auth, users, roles, debug, parent

# Create FastAPI app
app = FastAPI(
    title="Auth Service",
    description="Servizio di autenticazione e gestione utenti per l'app educativa",
    version="0.1.0",
)

# CORS configuration
# Configurazione più semplice che funziona meglio per consentire qualsiasi origine
# Utilizzo di allow_origins=["*"] ma con un middleware di supporto per le credenziali
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Consente richieste da qualsiasi origine
    allow_credentials=False,  # Disabilitato per permettere "*" nelle origini
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware personalizzato per gestire l'header Access-Control-Allow-Origin dinamicamente
# Questo è necessario perché allow_origins=["*"] e allow_credentials=True sono incompatibili
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    # Esegue la richiesta
    response = await call_next(request)
    
    # Estrae l'origine dalla richiesta
    origin = request.headers.get("origin")
    if origin:
        # Imposta l'origine specifica invece di "*" per consentire le credenziali
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# Include API routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(roles.router, prefix="/api/roles", tags=["Roles"])
app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])
app.include_router(parent.router, prefix="/api/auth/parent", tags=["Parent"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "auth-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
