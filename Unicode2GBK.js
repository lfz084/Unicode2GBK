(function(global, factory) {
    (global = global || self, factory(global));
}(this, (function(exports) {
    try {
        let count = 0,
            max = 0,
            min = 0xFFFFFFFF,
            decoder = new TextDecoder("GBK"),
            encoder = new TextEncoder(),
            GBK_Uint16 = new Uint16Array(0xFFFF).fill(-1),
            Unicode_Uint16 = new Uint16Array(0xFFFF).fill(-1),
            uint8 = new Uint8Array(2);

        function newChar(i, j) {
            uint8[0] = i;
            uint8[1] = j;
            let char = decoder.decode(uint8),
                p = char.codePointAt();
            GBK_Uint16[(i << 8) + j] = p;
            Unicode_Uint16[p] = (i << 8) + j;
            max < p && (max = p);
            min > p && (min = p);
            count++
        }
        for (let i = 0; i <= 127; i++) { //128
            GBK_Uint16[i] = Unicode_Uint16[i] = i;
        }
        //846
        for (let i = 0xA1; i <= 0xA9; i++) { //9
            for (let j = 0xA1; j <= 0xFE; j++) { //94
                newChar(i, j)
            }
        }
        //6768
        for (let i = 0xB0; i <= 0xF7; i++) { //72
            for (let j = 0xA1; j <= 0xFE; j++) { //94
                newChar(i, j)
            }
        }
        //6080
        for (let i = 0x81; i <= 0xA0; i++) { //32
            for (let j = 0x40; j <= 0xFE; j++) { //190
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        //192
        for (let i = 0xA8; i <= 0xA9; i++) { //2
            for (let j = 0x40; j <= 0xA0; j++) { //96
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        //8160
        for (let i = 0xAA; i <= 0xFE; i++) { //85
            for (let j = 0x40; j <= 0xA0; j++) { //96
                if (j != 0x7F) {
                    newChar(i, j)
                }
            }
        }
        //U+ 0000 ~ U+ 007F: 0X XXXXXX
        //U+ 0080 ~ U+ 07FF: 110 XXXXX 10 XXXXXX
        //U+ 0800 ~ U+ FFFF: 1110 XXXX 10 XXXXXX 10 XXXXXX
        //U+10000 ~ U+1FFFF: 11110 XXX 10 XXXXXX 10 XXXXXX 10 XXXXXX
        function codePointToUTF8(uCode) {
            if(uCode < 0x0080) {
                return uCode;
            }
            else if(uCode < 0x0800) {
                return 0xC080 | (uCode & 0x1F3F);
            }
            else if(uCode < 0x10000) {
                return 0xE08080 | (uCode & 0x0F3F3F);
            }
            else {
                return 0xF0808080 | (uCode & 0x073F3F3F);
            }
        }
        
        function utf8ToCodePoint() {
            
        }

        console.log(`max = ${max}\nmin = ${min}\ncount = ${count}`)
    }
    catch (e) { console.error(e.stack) }
})))
