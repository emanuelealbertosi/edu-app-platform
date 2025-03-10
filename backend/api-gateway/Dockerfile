FROM python:3.10-slim

WORKDIR /app

# Copia i file necessari
COPY requirements.txt .
COPY run.py .
COPY app/ app/

# Installa le dipendenze
RUN pip install --no-cache-dir -r requirements.txt

# Esponi la porta usata dal servizio
EXPOSE 8000

# Imposta variabili d'ambiente
ENV PYTHONPATH=/app

# Comando di avvio
CMD ["python", "run.py"]
