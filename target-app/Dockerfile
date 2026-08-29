FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY target_app ./target_app

EXPOSE 8080

CMD ["uvicorn", "target_app.main:app", "--host", "0.0.0.0", "--port", "8080"]
