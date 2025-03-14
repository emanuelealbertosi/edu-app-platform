from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import logging
import time
import uvicorn

from app.core.config import settings

# Configurazione del logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API Gateway per l'app educativa - Gestisce il routing verso i microservizi",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGINS_REGEX,
    allow_credentials=True,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Middleware per il logging delle richieste
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.4f}s")
    return response

# Funzione per verificare se l'endpoint richiede autenticazione
def requires_auth(path: str) -> bool:
    return not any(path.startswith(endpoint) for endpoint in settings.PUBLIC_ENDPOINTS)

# Funzione per determinare il servizio di destinazione
def get_target_service(path: str) -> str:
    # Prima controlliamo percorsi specifici che potrebbero dare problemi
    if path.startswith('/api/rewards/stats/'):
        logger.info(f"Routing speciale per percorso nidificato: {path} -> {settings.REWARD_SERVICE_URL}")
        return settings.REWARD_SERVICE_URL
        
    # Gestione normale per tutti gli altri percorsi
    for prefix, service_url in settings.SERVICE_ROUTES.items():
        if path.startswith(prefix):
            return service_url
            
    # Nessun servizio trovato per questo percorso
    logger.error(f"Nessun servizio trovato per il percorso: {path}")
    raise HTTPException(status_code=404, detail="Servizio non trovato")

# Endpoint di health check
@app.get("/")
async def health_check():
    return {"status": "ok", "service": "api-gateway"}

# Gestione di tutte le richieste API
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
async def api_gateway(request: Request, path: str):
    # Costruisci il percorso completo
    full_path = f"/{path}"
    
    # Log DEBUG dettagliato
    logger.info(f"API Gateway ricevuto percorso: {full_path}")
    
    # Caso speciale per le statistiche ricompense
    if "/api/rewards/stats/" in full_path:
        logger.info(f"PERCORSO CRITICO RICONOSCIUTO: {full_path}")
        target_service = settings.REWARD_SERVICE_URL
        logger.info(f"Reindirizzamento speciale a: {target_service}")
    else:
        # Determina il servizio di destinazione
        try:
            target_service = get_target_service(full_path)
            logger.info(f"Servizio target normale: {target_service}")
        except Exception as e:
            logger.error(f"Errore nel routing: {e}")
            raise
    
    # Costruisci l'URL di destinazione
    target_url = f"{target_service}{full_path}"
    logger.info(f"URL finale di destinazione: {target_url}")
    
    # Crea un nuovo client HTTP
    async with httpx.AsyncClient() as client:
        try:
            # Estrai il corpo della richiesta se presente
            request_body = await request.body()
            
            # Estrai gli header da inoltrare
            headers = {key: value for key, value in request.headers.items() 
                      if key.lower() not in ['host', 'content-length']}
            
            # Log della richiesta con dettagli header e auth
            auth_header = headers.get('authorization', 'NESSUNO')
            auth_present = 'PRESENTE' if auth_header else 'MANCANTE'
            logger.info(f"Proxy request to: {target_url} - Method: {request.method} - Auth: {auth_present}")
            
            # Invia la richiesta al servizio di destinazione
            response = await client.request(
                method=request.method,
                url=target_url,
                content=request_body,
                headers=headers,
                params=request.query_params,
                cookies=request.cookies,
                follow_redirects=True
            )
            
            # Log dettagliato della risposta
            logger.info(f"Risposta da {target_url}: Status {response.status_code}, Content-Type: {response.headers.get('content-type')}")
            
            # Crea la risposta da inviare al client
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.headers.get("content-type")
            )
        
        except httpx.RequestError as exc:
            logger.error(f"Errore durante la richiesta a {target_url}: {exc}")
            return JSONResponse(
                status_code=503,
                content={"detail": f"Errore di comunicazione con il servizio: {str(exc)}"}
            )
        except Exception as exc:
            logger.exception(f"Errore imprevisto: {exc}")
            return JSONResponse(
                status_code=500,
                content={"detail": f"Errore interno del server: {str(exc)}"}
            )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app", 
        host=settings.SERVER_HOST, 
        port=settings.SERVER_PORT,
        reload=True
    )
