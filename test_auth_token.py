import requests
import json
import sys
import base64
import pprint

# Configurazione
BASE_URL = "http://localhost:8000"  # Cambia questo in base alla tua configurazione
AUTH_ENDPOINT = f"{BASE_URL}/api/auth/login"
ACTIVITIES_ENDPOINT = f"{BASE_URL}/api/auth/activities"
DEBUG_ENDPOINT = f"{BASE_URL}/api/debug/token-debug"

# Credenziali
LOGIN_DATA = {
    "username": "admin",       # Username fornito dall'utente
    "password": "adminpass123" # Password fornita dall'utente
}

def login_and_get_token():
    """Effettua il login e ottiene i token JWT"""
    # Utilizziamo application/x-www-form-urlencoded come richiesto da OAuth2
    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    data = f"username={LOGIN_DATA['username']}&password={LOGIN_DATA['password']}"
    
    print(f"Invio richiesta di login con formato form-urlencoded")
    response = requests.post(AUTH_ENDPOINT, data=data, headers=headers)
    
    if response.status_code != 200:
        print(f"Errore durante il login: {response.status_code}")
        print(f"Dettagli: {response.text}")
        return None, None
    
    data = response.json()
    access_token = data.get("access_token")
    refresh_token = data.get("refresh_token")
    
    print(f"Login effettuato con successo!")
    print(f"Access Token: {access_token[:20]}... (troncato)")
    
    # Decodifica e analizza il token JWT
    try:
        token_parts = access_token.split('.')
        if len(token_parts) == 3:
            # Il payload è la seconda parte del token (header.payload.signature)
            payload_b64 = token_parts[1]
            # Aggiungiamo padding se necessario
            padding = 4 - (len(payload_b64) % 4) if len(payload_b64) % 4 else 0
            payload_b64 = payload_b64 + ('=' * padding)
            # Decodifica Base64URL a JSON
            payload_json = base64.b64decode(payload_b64.translate(str.maketrans('-_', '+/'))).decode('utf-8')
            payload = json.loads(payload_json)
            print("\n=== ANALISI DEL TOKEN JWT ===")
            print("Payload decodificato:")
            pprint.pprint(payload)
            print(f"Tipo del campo 'exp': {type(payload.get('exp')).__name__}")
            print(f"Valore del campo 'exp': {payload.get('exp')}")
            print(f"Tipo del campo 'sub': {type(payload.get('sub')).__name__}")
            print(f"Tipo del campo 'roles': {type(payload.get('roles')).__name__}")
    except Exception as e:
        print(f"Errore nell'analisi del token: {e}")
    
    return access_token, refresh_token

def debug_token(access_token):
    """Utilizza l'endpoint di debug per analizzare il token"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(DEBUG_ENDPOINT, headers=headers)
    
    if response.status_code != 200:
        print(f"Errore durante il debug del token: {response.status_code}")
        print(f"Dettagli: {response.text}")
        return
    
    data = response.json()
    print("\n=== DEBUG TOKEN ===")
    print(json.dumps(data, indent=2))
    return data

def test_activities_endpoint(access_token):
    """Testa l'endpoint /api/auth/activities con il token fornito"""
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(ACTIVITIES_ENDPOINT, headers=headers)
    
    print("\n=== TEST ACTIVITIES ENDPOINT ===")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        print("Successo! L'endpoint ha risposto correttamente")
        try:
            data = response.json()
            print(f"Dati ricevuti: {json.dumps(data, indent=2)}")
        except:
            print(f"Risposta non JSON: {response.text[:100]}")
    else:
        print(f"Errore nell'accesso all'endpoint: {response.text}")
    
    # Visualizza gli header completi della richiesta e della risposta per debugging
    print("\nHeaders della richiesta:")
    for key, value in response.request.headers.items():
        if key.lower() != "authorization":  # Non mostriamo il token completo
            print(f"{key}: {value}")
        else:
            print(f"{key}: Bearer [TOKEN NASCOSTO]")
    
    print("\nHeaders della risposta:")
    for key, value in response.headers.items():
        print(f"{key}: {value}")

def main():
    # Login e ottieni token
    access_token, refresh_token = login_and_get_token()
    if not access_token:
        sys.exit(1)
    
    # Debug del token
    debug_result = debug_token(access_token)
    
    # Testa l'endpoint problematico
    test_activities_endpoint(access_token)

if __name__ == "__main__":
    main()
