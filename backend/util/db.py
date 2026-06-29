import psycopg2
import os
import dotenv

dotenv.load_dotenv("../../.env")

def connect():
    try:
        connection = psycopg2.connect(
            host=os.environ.get("DB_HOST"),
            database=os.environ.get("DB_DATABASE"),
            port=os.environ.get("DB_PORT"),
            user=os.environ.get("DB_USER"),
            password=os.environ.get("DB_PASSWORD")
        )
        return connection
    except:
        return False

def executeQuery(connect, query, params=None):
    cur = connect.cursor()
    if params:
        cur.execute(query, params)
        connect.commit()
        return
    else:
        cur.execute(query)
        result = cur.fetchall()
        return result