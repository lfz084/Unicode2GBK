(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    try { 
        let gbkDecoder = new TextDecoder("gb18030"),
        utf8Decoder = new TextDecoder(),
        encoder = new TextEncoder(),
        GBK2Unicode = new Map(),
        Unicode2GBK = new Map(),
        char16bit = new Uint8Array(2),
        char32bit = new Uint8Array(4),
        uint32 = new Uint32Array(1);
        
    /*--------------- 用Map映射编码表 -----------------*/
        
        function uInt(number) {
            uint32[0] = number;
            return uint32[0];
        }

        function newChar(gbkCode, codePoint) {
            if (codePoint == 65533) return;
            GBK2Unicode.set(gbkCode, codePoint);
            Unicode2GBK.set(codePoint, gbkCode);
        }

        function newChar8(i) {
            newChar(i, i);
        }

        function newChar16(i, j) {
            char16bit[0] = i;
            char16bit[1] = j;
            let char = gbkDecoder.decode(char16bit),
                p = char.codePointAt();
            newChar(i << 8 | j, p);
        }

        function newChar32(i, j, k, l) {
            char32bit[0] = i;
            char32bit[1] = j;
            char32bit[2] = k;
            char32bit[3] = l;
            let char = gbkDecoder.decode(char32bit),
                p = char.codePointAt();
            newChar(uInt(i << 24 | j << 16 | k << 8 | l), p);
        }
        //0x00~0x7F
        for (let i = 0; i <= 127; i++) { //128
            newChar8(i);
        }
        //0x81~0xFE, 0x40~0xFE 
        for (let i = 0x81; i <= 0xFE; i++) {
            for (let j = 0x40; j <= 0xFE; j++) {
                newChar16(i, j)
            }
        }
        // 81~84,30~39,81~FE,30~39
        for (let i = 0x81; i <= 0x84; i++) {
            for (let j = 0x30; j <= 0x39; j++) {
                for (let k = 0x81; k <= 0xFE; k++) {
                    for (let l = 0x30; l <= 0x39; l++) {
                        newChar32(i, j, k, l);
                    }
                }
            }
        }
        // 95~9A,30~39,81~FE,30~39
        for (let i = 0x95; i <= 0x9A; i++) {
            for (let j = 0x30; j <= 0x39; j++) {
                for (let k = 0x81; k <= 0xFE; k++) {
                    for (let l = 0x30; l <= 0x39; l++) {
                        newChar32(i, j, k, l);
                    }
                }
            }
        }
        
        //U+ 0000 ~ U+ 007F: 0X XXXXXX
        //U+ 0080 ~ U+ 07FF: 110 XXXXX 10 XXXXXX
        //U+ 0800 ~ U+ FFFF: 1110 XXXX 10 XXXXXX 10 XXXXXX
        //U+10000 ~ U+1FFFF: 11110 XXX 10 XXXXXX 10 XXXXXX 10 XXXXXX
        function codePointToUTF8CodePoint(uCode) {
            if (uCode < 0x0080)
                return uCode;
            else if (uCode < 0x0800)
                return 0xC080 | (uCode & 0x07C0) << 2 | (uCode & 0x3F);
            else if (uCode < 0x10000)
                return 0xE08080 | (uCode & 0xF000) << 4 | (uCode & 0x0FC0) << 2 | (uCode & 0x3F);
            else
                return uInt(0xF0808080 | (uCode & 0x1C0000) << 6 | (uCode & 0x03F000) << 4 | (uCode & 0x0FC0) << 2 | (uCode & 0x3F));
        }

        function utf8CodePointToCodePoint(u8Code) {
            if (u8Code < 0x0080)
                return u8Code;
            else if (u8Code < 0xE08080)
                return (u8Code & 0x1F00) >>> 2 | (u8Code & 0x3F);
            else if (u8Code < 0xF0808080)
                return (u8Code & 0x0F0000) >>> 4 | (u8Code & 0x3F00) >>> 2 | (u8Code & 0x3F);
            else
                return (u8Code & 0x07000000) >> 6 | (u8Code & 0x3F0000) >>> 4 | (u8Code & 0x3F00) >>> 2 | (u8Code & 0x3F);
        }

        function utf8CodePointToGBKCodePoint(u8Code) {
            let result = Unicode2GBK.get(utf8CodePointToCodePoint(u8Code));
            (result == undefined) && (result = 0xAB37B031);
            return result;
        }

        function gbkCodePointToUTF8CodePoint(gbkCode) {
            let codePoint = GBK2Unicode.get(gbkCode);
            (codePoint == undefined) && (codePoint = 65533);
            return codePointToUTF8CodePoint(codePoint);
        }

        function putUTF8Buffer(gbkBuffer, gStart, gEnd, utf8Buffer, uStart) {
            let start = uStart;
            while (gStart < gEnd) {
                let gCode = gbkBuffer[gStart++];
                if (gCode < 0x0080) {
                    utf8Buffer[uStart++] = gCode;
                }
                else {
                    gCode = gCode << 8 | gbkBuffer[gStart++];
                    if ((gCode & 0xFF) < 0x40) gCode = uInt(gCode << 16 | gbkBuffer[gStart++] << 8 | gbkBuffer[gStart++]);
                    let uCode = gbkCodePointToUTF8CodePoint(gCode);
                    if (uCode < 0xE08080) {
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                    else if (uCode < 0xF0808080) {
                        utf8Buffer[uStart++] = uCode >> 16 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                    else {
                        utf8Buffer[uStart++] = uCode >> 24 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 16 & 0xFF;
                        utf8Buffer[uStart++] = uCode >> 8 & 0xFF;
                        utf8Buffer[uStart++] = uCode & 0xFF;
                    }
                }
            }
            return uStart - start;
        }

        function putGBKBuffer(utf8Buffer, uStart, uEnd, gbkBuffer, gStart) {
            let start = gStart;
            while (uStart < uEnd) {
                let uCode = utf8Buffer[uStart++];
                if (uCode < 0x0080) {
                    gbkBuffer[gStart++] = uCode;
                }
                else {
                    if (uCode < 0xE0) {
                        uCode = uCode << 8 | utf8Buffer[uStart++];
                    }
                    else if (uCode < 0xF0) {
                        uCode = uCode << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    else {
                        uCode = uInt(uCode << 24 | utf8Buffer[uStart++] << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++]);
                    }
                    let gCode = utf8CodePointToGBKCodePoint(uCode);
                    if (gCode < 0xFFFF) {
                        gbkBuffer[gStart++] = gCode >> 8 & 0xFF;
                        gbkBuffer[gStart++] = gCode & 0xFF;
                    }
                    else {
                        gbkBuffer[gStart++] = gCode >> 24 & 0xFF;
                        gbkBuffer[gStart++] = gCode >> 16 & 0xFF;
                        gbkBuffer[gStart++] = gCode >> 8 & 0xFF;
                        gbkBuffer[gStart++] = gCode & 0xFF;
                    }
                }
            }
            return gStart - start;
        }

        function gbkBuffer2UTF8Buffer(gbkBuffer) {
            let tempBuffer = new Uint8Array(parseInt(gbkBuffer.length * 2)),
                len = putUTF8Buffer(gbkBuffer, 0, gbkBuffer.length, tempBuffer, 0);
            return new Uint8Array(tempBuffer.slice(0, len));
        }

        function utf8Buffer2GBKBuffer(utf8Buffer) {
            let tempBuffer = new Uint8Array(parseInt(utf8Buffer.length * 2)),
                len = putGBKBuffer(utf8Buffer, 0, utf8Buffer.length, tempBuffer, 0);
            return new Uint8Array(tempBuffer.slice(0, len));
        }

        function decode(buffer, encoding = "utf-8") {
            const DECODER = {
                GBK: gbkDecoder,
                GB2312: gbkDecoder,
                GB18030: gbkDecoder,
                "UTF-8": utf8Decoder
             }
            encoding = encoding.toUpperCase();
            return (DECODER[encoding] || utf8Decoder).decode(buffer);
        }

        function encode(str, encoding = "utf-8") {
            let result = encoder.encode(str);
            switch (encoding.toUpperCase()) {
                case "GBK":
                case "GB2312":
                case "GB18030":
                    result = utf8Buffer2GBKBuffer(result);
                    break;
            }
            return result;
        }

        function string2Code(str, encoding = "Unicode") {
            const TOCODE = {
                GBK: utf8CodePointToGBKCodePoint,
                GB2312: utf8CodePointToGBKCodePoint,
                GB18030: utf8CodePointToGBKCodePoint,
                UNICODE: utf8CodePointToCodePoint
            }
            let utf8Buffer = encoder.encode(str),
                uStart = 0,
                uEnd = utf8Buffer.length,
                codeArr = [];
            encoding = encoding.toUpperCase();
            while (uStart < uEnd) {
                let uCode = utf8Buffer[uStart++];
                if (uCode < 0x0080) {
                    codeArr.push(uCode);
                } 
                else {
                    if (uCode < 0xE0) {
                        uCode = uCode << 8 | utf8Buffer[uStart++];
                    }
                    else if (uCode < 0xF0) {
                        uCode = uCode << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++];
                    }
                    else {
                        uCode = uInt(uCode << 24 | utf8Buffer[uStart++] << 16 | utf8Buffer[uStart++] << 8 | utf8Buffer[uStart++]);
                    }
                    let code = (TOCODE[encoding] || utf8CodePointToCodePoint)(uCode);
                    codeArr.push(code);
                }
            }
            return codeArr;
        }
 
        function code2String(codeArr, encoding = "Unicode") {
            const ISGBK = {
                GBK: true,
                GB2312: true,
                GB18030: true,
                UNICODE: false
            }
            let buffer = new Uint8Array(parseInt(codeArr.length * 4)),
                len = 0,
                start = 0,
                end = codeArr.length;
            encoding = encoding.toUpperCase();
            while (start < end) {
                let code = codeArr[start++];
                if (code < 0x0080) {
                    buffer[len++] = code;
                }
                else if (ISGBK[encoding]) {
                    if (code < 0xFFFF) {                        
                        buffer[len++] = code >> 8 & 0xFF;
                        buffer[len++] = code & 0xFF;
                    }
                    else {
                        buffer[len++] = code >> 24 & 0xFF;
                        buffer[len++] = code >> 16 & 0xFF;
                        buffer[len++] = code >> 8 & 0xFF;
                        buffer[len++] = code & 0xFF;
                    }
                }
                else if (code < 0x0800) {
                    buffer[len++] = 0xC0 | (code >> 6 & 0x1F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                } 
                else if (code < 0x10000) {
                    buffer[len++] = 0xE0 | (code >> 12 & 0x0F);
                    buffer[len++] = 0x80 | (code >> 6 & 0x3F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                }
                else {
                    buffer[len++] = 0XF0 | (code >> 18 & 0x07);
                    buffer[len++] = 0x80 | (code >> 12 & 0x3F);
                    buffer[len++] = 0x80 | (code >> 6 & 0x3F);
                    buffer[len++] = 0x80 | (code & 0x3F);
                }
            }
            return decode(new Uint8Array(buffer.slice(0, len)), encoding);
        }

        function autoEncoding(buffer) {

        }

        exports.TextCoder = {
            decode: decode,
            encode: encode,
            string2Code: string2Code,
            code2String: code2String,
            putUTF8Buffer: putUTF8Buffer,
            putGBKBuffer: putGBKBuffer,
            gbkBuffer2UTF8Buffer: gbkBuffer2UTF8Buffer,
            utf8Buffer2GBKBuffer: utf8Buffer2GBKBuffer
        }
    }
    catch (e) { alert(e.stack) }
})))
