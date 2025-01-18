// Requires filebuf-SWITCHjs.js
function parse8xp (fileBuf) {
    let header = fileBuf.buf(0x00, 0x37)
        let header_name = header.str(0x00, 0x0B)
            FileBuf.expectVal(header_name, "**TI83F*\x1A\x0A\x00", "File does not start with \"**TI83F*\\x1A\\x0A\\x00\"")
        let header_comment = header.str(0x0B, 0x2A)
            header_comment = header_comment.replaceAll("\x00", "")
        let header_dataSectionLength = header.int(0x35, 0x02, {endian: Endian.LITTLE})
    let dataSection = fileBuf.buf(0x37, header_dataSectionLength)
        let dataSection_type = dataSection.int(0x00, 0x02, {endian: Endian.LITTLE})
            FileBuf.expectVal(dataSection_type, [0x0B, 0x0D], "Data section type is invalid")
            let dataSection_lastInfoOffsetAdd = null
            if (dataSection_type == 0x0B) dataSection_lastInfoOffsetAdd = 0x00
            else if (dataSection_type == 0x0D) dataSection_lastInfoOffsetAdd = 0x02
        let dataSection_dataLength = dataSection.int(0x02, 0x02, {endian: Endian.LITTLE})
        let dataSection_typeId = dataSection.int(0x04, 0x01, {endian: Endian.LITTLE})
            FileBuf.expectVal(dataSection_typeId, 0x05, "Type ID says file is not a program")
        let dataSection_name = dataSection.str(0x05, 0x08)
            dataSection_name = dataSection_name.replaceAll("\x00", "")
        let dataSection_version = null
        let dataSection_flag = null
            let dataSection_isArchived = null
        if (dataSection_type == 0x0D) {
            dataSection_version = dataSection.int(0x0D, 0x01, {endian: Endian.LITTLE})
            dataSection_flag = dataSection.int(0x0E, 0x01, {endian: Endian.LITTLE})
                FileBuf.expectVal(dataSection_flag, [0x00, 0x80], "Data section flag is invalid")
                if (dataSection_flag == 0x00) dataSection_isArchived = false
                else if (dataSection_flag == 0x80) dataSection_isArchived = true
        }
        let dataSection_dataLength2Unused = dataSection.int(0x0D + dataSection_lastInfoOffsetAdd, 0x02, {endian: Endian.LITTLE})
        let data_tokenBytesCount = dataSection.int(0x0F + dataSection_lastInfoOffsetAdd, 0x02, {endian: Endian.LITTLE})
        let data = dataSection.buf(0x11 + dataSection_lastInfoOffsetAdd, dataSection_dataLength - 0x02)
            let data_tokens = []
            let dataArr = [...data.arr(0x00, data.data.byteLength)]
            for (let i = 0; i < dataArr.length; i++) {
                let bytes = dataArr.slice(i)
                bytes = bytes.map(val => val.toString(16).padStart(2, "0").toUpperCase())
                let token = tokens8xp_bytes2token(bytes)
                data_tokens.push(token.result)
                if (token.linked) i++
            }
            let data_tokensText = data_tokens.join("")
    let checksum = fileBuf.int(0x37 + header_dataSectionLength, 0x02, {endian: Endian.LITTLE})
        let calcChecksum = 0
        let dataSectionArr = [...dataSection.arr(0x00, dataSection.data.byteLength)]
        for (let byte of dataSectionArr) calcChecksum += byte
        calcChecksum &= 0xFFFF
        FileBuf.expectVal(checksum, calcChecksum, "Invalid checksum")
    return {
        name: dataSection_name,
        comment: header_comment,
        version: dataSection_version,
        archived: dataSection_isArchived,
        text: data_tokensText,
    }
}
