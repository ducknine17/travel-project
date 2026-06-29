def convertDict(data: list, column: list):
    result = []
    for datum in data:
        res = {}
        for i in range(len(datum)):
            res[column[i]] = datum[i]
        result.append(res)

    return result