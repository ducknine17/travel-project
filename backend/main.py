import os
import psycopg2
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import dotenv

dotenv.load_dotenv("../.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connection = psycopg2.connect(
    host=os.environ.get("DB_HOST"),
    database=os.environ.get("DB_DATABASE"),
    port=os.environ.get("DB_PORT"),
    user=os.environ.get("DB_USER"),
    password=os.environ.get("DB_PASSWORD")
    )
print("DB_Connected")

@app.get('/api/start')
def start():
    return HTTPException(404, "Hi")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("HOST_PORT")))