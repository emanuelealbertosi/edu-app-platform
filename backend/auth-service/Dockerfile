FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Esporre la porta che sarà utilizzata dal servizio
EXPOSE 8001

# Comando per avviare il servizio
CMD ["python", "run.py"]
