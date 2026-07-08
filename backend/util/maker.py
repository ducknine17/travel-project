import time
import hashlib

def convertDict(data: list, column: list):
    result = []
    for datum in data:
        res = {}
        for i in range(len(datum)):
            res[column[i]] = datum[i]
        result.append(res)

    return result

def idMaker():
    return hashlib.md5(str(time.time()).encode("utf-8")).hexdigest()