from util.db import connect, executeQuery
import bcrypt

def postChecker(id, author):
    con = connect()
    query = "SELECT * FROM post.post WHERE id = %s AND author = %s"
    res = executeQuery(con, query, (id, author))

    if res == []:
        return False

    return True

def registerChecker(id):
    con = connect()
    query = "SELECT * FROM \"user\".user WHERE id = %s"
    res = executeQuery(con, query, (id,))
    if res == []:
        return False

    return True

def loginChecker(id, password):
    con = connect()
    query = "SELECT password FROM \"user\".user WHERE id = %s"
    res = executeQuery(con, query, (id,))
    if res == []:
        return False

    pw = res[0][0]

    return bcrypt.checkpw(
        password.encode("utf-8"),
        pw.encode("utf-8")
    )


def validateChecker(id):
    con = connect()
    query = "SELECT * FROM \"user\".validate WHERE id = %s"
    res = executeQuery(con, query, (id, ))
    if res == []:
        return False

    if res[0][2] == True:
        return False

    uid = res[0][1]
    query = "UPDATE \"user\".validate SET is_used = true WHERE id = %s"
    res = executeQuery(con, query, (id, ))

    query = "UPDATE \"user\".user SET is_available = true WHERE id = %s"
    res = executeQuery(con, query, (uid,))

    return True