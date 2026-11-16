FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system --gid 10001 cloudopt \
    && useradd --system --uid 10001 --gid 10001 --no-create-home cloudopt

COPY --chown=10001:10001 target_app ./target_app

USER 10001:10001

EXPOSE 8080

CMD ["uvicorn", "target_app.main:app", "--host", "0.0.0.0", "--port", "8080"]
