// Requires filebuf-SWITCHjs.js
function parse8xp (fileBuf) {
    let header = fileBuf.buf(0x00, 0x37)
        let header_name = header.str(0x00, 0x0A)
            FileBuf.expectVal(header_name, "**TI83F*\x1A\x0A", `Invalid file magic - expected "**TI83F*\\x1A\\x0A", got "${header_name}"`)
        let header_name2unknown = header.int(0x0B, 0x01, {endian: Endian.LITTLE})
        let header_comment = header.str(0x0B, 0x2A)
            header_comment = header_comment.replaceAll("\x00", "")
        let header_dataSectionLength = header.int(0x35, 0x02, {endian: Endian.LITTLE})
    let dataSection = fileBuf.buf(0x37, header_dataSectionLength)
        let dataSection_type = dataSection.int(0x00, 0x02, {endian: Endian.LITTLE})
            FileBuf.expectVal(dataSection_type, [0x0B, 0x0D], `Data section type is invalid - expected 0x0B or 0x0D, got 0x${dataSection_type.toString(16).toUpperCase()}`)
            let dataSection_lastInfoOffsetAdd = null
            if (dataSection_type == 0x0B) dataSection_lastInfoOffsetAdd = 0x00
            else if (dataSection_type == 0x0D) dataSection_lastInfoOffsetAdd = 0x02
        let dataSection_dataLength = dataSection.int(0x02, 0x02, {endian: Endian.LITTLE})
        let dataSection_typeId = dataSection.int(0x04, 0x01, {endian: Endian.LITTLE})
            FileBuf.expectVal(dataSection_typeId, [0x05, 0x06], `Type ID says file is not a program - expected 0x05 or 0x06, got 0x${dataSection_typeId.toString(16).toUpperCase()}`)
            let dataSection_protected = null
            if (dataSection_typeId == 0x05) dataSection_protected = false
            else if (dataSection_typeId == 0x06) dataSection_protected = true
        let dataSection_name = dataSection.str(0x05, 0x08)
            dataSection_name = dataSection_name.replaceAll("\x00", "")
        let dataSection_version = null
        let dataSection_flag = null
            let dataSection_isArchived = null
        if (dataSection_type == 0x0D) {
            dataSection_version = dataSection.int(0x0D, 0x01, {endian: Endian.LITTLE})
            dataSection_flag = dataSection.int(0x0E, 0x01, {endian: Endian.LITTLE})
                FileBuf.expectVal(dataSection_flag, [0x00, 0x80], `Data section flag is invalid - expected 0x00 or 0x80, got 0x${dataSection_flag.toString(16).toUpperCase()}`)
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
        FileBuf.expectVal(checksum, calcChecksum, `Invalid checksum - expected 0x${calcChecksum.toString(16).toUpperCase()} (based on file contents), got 0x${checksum.toString(16).toUpperCase()}`)
    return {
        name: dataSection_name,
        comment: header_comment,
        version: dataSection_version,
        archived: dataSection_isArchived,
        protected: dataSection_protected,
        text: data_tokensText,
    }
}
