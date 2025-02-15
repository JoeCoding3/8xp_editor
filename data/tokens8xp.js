let tokens8xp_data = {"0": null, "1": null, "2": null, "3": null}
async function tokens8xp_fetchData () {
    let csvList = []
    for (let id = 0; id <= 3; id++) {
        let resp = await fetch(`./data/tokens8xp-${id}.csv`)
        let csv = await resp.text()
        csvList.push(csv)
    }
    tokens8xp_loadData(...csvList)
}
function tokens8xp_loadData (csv0, csv1, csv2, csv3) {
    let csvList = [csv0, csv1, csv2, csv3]
    for (let id = 0; id < csvList.length; id++) tokens8xp_data[id] = csvLoader_parseCsv(csvList[id])
}

function tokens8xp_bytes2token (bytes) {
    let result = tokens8xp_data[0][bytes[0][1]][bytes[0][0]]
    if (result.startsWith("\\LNK-")) {
        let link = +result.substring(5)
        let linkResult = null
        if (link == 1) linkResult = tokens8xp_data[link][bytes[0]][bytes[1]]
        else if (link == 2 || link == 3 || link == 4) linkResult = tokens8xp_data[link][bytes[1][1]][bytes[1][0]]
        return {result: linkResult, linked: true}
    } else return {result: result, linked: false}
}
