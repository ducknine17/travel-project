import psycopg2
import os
import dotenv
from pathlib import Path

dotenv.load_dotenv(Path(__file__).resolve().parents[2] / ".env")

def connect():
    connection = psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        database=os.environ.get("DB_DATABASE"),
        port=os.environ.get("DB_PORT"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD")
    )
    return connection


def executeQuery(connect, query, params=None):
    cur = connect.cursor()
    try:
        if params is not None:
            cur.execute(query, params)
        else:
            cur.execute(query)

        if query.strip().upper().startswith("SELECT"):
            return cur.fetchall()

        connect.commit()
        return None
    finally:
        cur.close()
