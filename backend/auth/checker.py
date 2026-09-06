from util.db import connect, executeQuery
import bcrypt

def postChecker(id, author):
    con = connect()
    try:
        query = "SELECT * FROM post.post WHERE id = %s AND author = %s"
        res = executeQuery(con, query, (id, author))
    finally:
        con.close()

    if res == []:
        return False

    return True

def registerChecker(id):
    con = connect()
    try:
        query = "SELECT * FROM \"user\".user WHERE id = %s"
        res = executeQuery(con, query, (id,))
    finally:
        con.close()
    if res == []:
        return False

    return True

def loginChecker(id, password):
    con = connect()
    try:
        query = "SELECT uid, password, is_available FROM \"user\".user WHERE id = %s"
        res = executeQuery(con, query, (id,))
    finally:
        con.close()
    if res == []:
        return None

    uid, pw, is_available = res[0]

    if not is_available:
        return None

    if not bcrypt.checkpw(
        password.encode("utf-8"),
        pw.encode("utf-8")
    ):
        return None

    return uid


def validateChecker(id):
    con = connect()
    try:
        query = "SELECT * FROM \"user\".validate WHERE id = %s"
        res = executeQuery(con, query, (id, ))
        if res == []:
            return False

        if res[0][2] is True:
            return False

        uid = res[0][1]
        query = "UPDATE \"user\".validate SET is_used = true WHERE id = %s"
        executeQuery(con, query, (id, ))

        query = "UPDATE \"user\".user SET is_available = true WHERE uid = %s"
        executeQuery(con, query, (uid,))

        return True
    finally:
        con.close()
