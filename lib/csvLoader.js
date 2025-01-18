function csvLoader_parseCsv (csv) {
    let header = []
    let out = {}
    let lines = csv.split("\n")
    lines.splice(lines.length - 1, 1)
    for (let line of lines) {
        let fields = []
        let inField = false
        for (let i = 0; i < line.length; i++) {
            let char = line[i]
            if (!inField && char == "\"") {
                inField = true
                fields.push("")
            } else if (inField && char == "\"") {
                if (line[i + 1] == "\"") {
                    fields[fields.length - 1] += char
                    i++
                } else inField = false
            } else if (!inField && char == ",") null
            else if (inField) fields[fields.length - 1] += char
        }
        let lineId = fields.splice(0, 1)

        if (lineId == "\\TBL") {
            header = fields
            for (let headerField of header) out[headerField] = {}
        } else {
            for (let i = 0; i < fields.length; i++) {
                let headerField = header[i]
                let field = fields[i]
                if (field == "\\NUL") field = null
                if (field == "\\BRK") field = "\n"
                out[headerField][lineId] = field
            }
        }
    }
    return out
}
