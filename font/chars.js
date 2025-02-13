let chars_data = {"chars": {}, "csv": {}}
async function chars_fetchData () {
    let img = document.createElement("img")
    img.src = `./font/chars-${0}.png`
    await new Promise(resolve => img.onload = resolve)
    let canvas = document.createElement("canvas")
    canvas.width = img.width
    canvas.height = img.height
    let ctx = canvas.getContext("2d", {willReadFrequently: true})
    ctx.drawImage(img, 0, 0)

    let resp = await fetch(`./font/chars-${0}.csv`)
    let csv = await resp.text()

    chars_loadData(ctx, csv)
}
function chars_loadData (chars, csv) {
    chars_data.chars = chars
    chars_data.csv = csvLoader_parseCsv(csv)
}

function chars_getChar (name) {
    let id = null
    let tblKeys = Object.keys(chars_data.csv)
    for (let i = 0; i < tblKeys.length; i++) {
        let row = chars_data.csv[tblKeys[i]]
        let rowKeys = Object.keys(row)
        for (let j = 0; j < rowKeys.length; j++) {
            let field = row[rowKeys[j]]
            if (field == name) {
                id = j.toString(16).toUpperCase() + i.toString(16).toUpperCase()
                break
            }
        }
    }
    if (id == null) return null

    let x = (parseInt(id[1], 16) * (6 + 1)) + 1
    let y = (parseInt(id[0], 16) * (8 + 1)) + 1
    let imgData = chars_data.chars.getImageData(x, y, 6, 8).data
    let data = []
    for (let i = 0; i < imgData.length; i += 4) {
        let r = imgData[i]
        let g = imgData[i + 1]
        let b = imgData[i + 2]
        let a = imgData[i + 3]
        if (r != 0 || g != 0 || b != 0) a = 0
        let col = `rgba(${r}, ${g}, ${b}, ${a})`
        data.push(col)
    }
    return data
}

let chars_screenSizeMul = 6
let chars_screenTextScale = 3
function chars_tokenizeText (text) {
    let tokens = []
    let inLongToken = false
    let longToken = null
    for (let i = 0; i < text.length; i++) {
        let char = text[i]
        if (!inLongToken && char == "~") {
            inLongToken = true
            longToken = ""
        } else if (inLongToken && char == "~") {
            inLongToken = false
            tokens.push(longToken)
            longToken = null
        } else if (inLongToken) longToken += char
        else if (!inLongToken) tokens.push(char)
    }
    return tokens
}
function chars_renderText (text, canvas) {
    let ctx = canvas.getContext("2d")
    ctx.fillStyle = "black"

    let tokens = chars_tokenizeText(text)
    function draw (tokens, ctx, test = false) {
        let maxX = 0
        let maxY = 0
        let charX = 0
        let charY = 0
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i]
            let data = chars_getChar(token)
            if (token == "\n") {
                charX = 0
                charY++
            } else {
                for (let i = 0; i < data.length; i++) {
                    let col = data[i]
                    let x = ((charX * 6) + (i % 6)) * chars_screenSizeMul
                    let y = ((charY * 8) + Math.floor(i / 6)) * chars_screenSizeMul
                    
                    if (!test) ctx.fillStyle = col
                    if (!test) ctx.fillRect(x, y, chars_screenSizeMul, chars_screenSizeMul)
                    if (maxX < x) maxX = x
                    if (maxY < y) maxY = y
                }
                charX++
            }
        }
        maxX += chars_screenSizeMul
        maxY += chars_screenSizeMul
        return {maxX, maxY}
    }

    canvas.width = (16 * 6) * chars_screenSizeMul * chars_screenTextScale
    let {maxX, maxY} = draw(tokens, null, true)
    canvas.width = maxX
    canvas.height = maxY
    canvas.style.width = (maxX / chars_screenTextScale) + "px"
    canvas.style.height = (maxY / chars_screenTextScale) + "px"
    draw(tokens, ctx)
}
