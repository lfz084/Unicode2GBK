try {
    /* -----------  GB18030-2005 -------------
            单字节字符
            0x00~0x7F
            
            双字节字符
            首字节     尾字节               码位数      字符数
            0xA1~0xA9, 0xA1~0xFE            846         718
            0xA8~0xA9, 0x40~0xA0, != 0x7F   192         166
            0xB0~0xF7, 0xA1~0xFE            6768        6763
            0x81~0xA0, 0x40~0xFE, != 0x7F   6080        6080
            0xAA~0xFE, 0x40~0xA0, != 0x7F   8160        8160
            
            0x81~0xFE, 0x40~0xFE
            
            四字节字符                      码位数      字符数
            0x81318132~0x81319934           243         49
            0x8430BA32~0x8430FE35           684         67
            0x84318730~0x84319530           141         86
            0x8132E834~0x8132FD31           208         193
            0x8134D283~0x8134E337           170         149
            0x8134F434~0x8134F830           37          35
            0x82359833~0x82369435           1223        1215
            0x81339D36~0x8133B635           250         69
            0x8139A933~0x8139B734           142         51
            0x8237CF35~0x8336BE36           11172       3376
            0x8139EE39~0x82358738           6530        6530
            0x95328236~0x9835F336           42711       42711
            
            81~84,30~39,81~FE,30~39
            95~9A,30~39,81~FE,30~39
            
            编码数 150194 个
            有效编码数 139087 个
            
            Unicode连续编码
            0~12288
            12288~55295
            57344~58852
            58854~65532
            65534~65535
            128536~204135
            */
            
    self.startCode = null,
        preCode = null,
        count = 0,
        count12288 = 0,
        count65533 = 0,
        max = 0,
        min = 0xFFFFFFFF,
        list = [],
        Unicode2GBK_myMap = null,
        GBK2Unicode_myMap = null,
        Unicode2GBK_Map = new Map(),
        GBK2Unicode_Map = new Map(),
        output = "",
        gbkDecoder = new TextDecoder("gb18030"),
        utf8Decoder = new TextDecoder(),
        encoder = new TextEncoder(),
        GBK2Unicode_Uint32 = new Uint32Array(150194).fill(65533),
        Unicode2GBK_Uint32 = new Uint32Array(139087).fill(0xAB37B031),
        char16bit = new Uint8Array(2),
        char32bit = new Uint8Array(4),
        uint32 = new Uint32Array(1);
        
        
    function uInt(number) {
        uint32[0] = number;
        return uint32[0];
    }
        
    function createMap() {
        function markStartCode(gbkCode, codePoint) {
            startCode = { gbkCode: gbkCode, codePoint: codePoint };
            preCode = { gbkCode: gbkCode, codePoint: codePoint };
        }

        function continueCode(gbkCode, codePoint) {
            if (preCode.codePoint + 1 == codePoint) {
                preCode = { gbkCode: gbkCode, codePoint: codePoint };
            }
            else {
                list.push({ startCode: startCode, preCode: preCode })
                markStartCode(gbkCode, codePoint);
            }
        }

        function addList(gbkCode, codePoint) {
            if (!startCode) markStartCode(gbkCode, codePoint)
            else continueCode(gbkCode, codePoint)
        }

        function newChar(gbkCode, codePoint) {
            GBK2Unicode_Uint32[count++] = codePoint;
            if (codePoint == 12288) count12288++;
            if (codePoint == 65533) {count65533++; return;}
            Unicode2GBK_Map.set(codePoint, gbkCode);
            GBK2Unicode_Map.set(gbkCode, codePoint);
            max < codePoint && (max = codePoint);
            min > codePoint && (min = codePoint);
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
    
    
        // count = 0
        list.push(count);
        for (let i = 0; i <= 127; i++) { //128
            newChar8(i);
        }
        // count = 128
        //0x81~0xFE, 0x40~0xFE
        list.push(count);
        for (let i = 0x81; i <= 0xFE; i++) {
            for (let j = 0x40; j <= 0xFE; j++) {
                newChar16(i, j)
            }
        }
        // count = 24194
        // 81~84,30~39,81~FE,30~39
        list.push(count);
        for (let i = 0x81; i <= 0x84; i++) {
            for (let j = 0x30; j <= 0x39; j++) {
                for (let k = 0x81; k <= 0xFE; k++) {
                    for (let l = 0x30; l <= 0x39; l++) {
                        newChar32(i, j, k, l);
                    }
                }
            }
        }
        // count = 74594
        // 95~9A,30~39,81~FE,30~39
        list.push(count);
        for (let i = 0x95; i <= 0x9A; i++) {
            for (let j = 0x30; j <= 0x39; j++) {
                for (let k = 0x81; k <= 0xFE; k++) {
                    for (let l = 0x30; l <= 0x39; l++) {
                        newChar32(i, j, k, l);
                    }
                }
            }
        }
        output += `最大Unicode = ${max}\n最小Unicode = ${min}\n编码数 = ${count}\n有效编码数 = ${count-count65533}\n`
        output += `映射到u+12288 = ${count12288}个\n映射到u+65533 = ${count65533}个\n`
        output += `GB18030连续编码\n${list.map(v=>`${v}`).join("\n")}\n`

        /*
        GBK2Unicode_Uint32.sort();
        list = []
        startCode = null
        for(let i=0; i < GBK2Unicode_Uint32.length; i++) {
            if (GBK2Unicode_Uint32[i] != 65533) {
                addList(i, GBK2Unicode_Uint32[i])
                max < GBK2Unicode_Uint32[i] && (max = GBK2Unicode_Uint32[i]);
            }
        }
        addList(0,-1)
        output += `Unicode连续编码\n${list.map(n => `${n.startCode.codePoint} ~ ${n.preCode.codePoint}`).join("\n")}\n`
        return;
        */
        
        count = 0;
        list = [];
        // count = 0
        list.push(count);
        for (let i = 0; i <= 55295; i++) {
            let gCode = Unicode2GBK_Map.get(i);
            if(gCode == undefined) alert(`u+${i} error`)
            Unicode2GBK_Uint32[count++] = gCode;
        }
        // count = 55296
        list.push(count);
        for (let i = 57344; i <= 58852; i++) {
            let gCode = Unicode2GBK_Map.get(i);
            if(gCode == undefined) alert(`u+${i} error`)
            Unicode2GBK_Uint32[count++] = gCode;
        }
        // count = 56805
        list.push(count);
        for (let i = 58854; i <= 65532; i++) {
            let gCode = Unicode2GBK_Map.get(i);
            if(gCode == undefined) alert(`u+${i} error`)
            Unicode2GBK_Uint32[count++] = gCode;
        }
        Unicode2GBK_Uint32[count++] = 0xAB37B031; //65533
        for (let i = 65534; i <= 65535; i++) {
            let gCode = Unicode2GBK_Map.get(i);
            if(gCode == undefined) alert(`u+${i} error`)
            Unicode2GBK_Uint32[count++] = gCode;
        }
        // count = 63487
        list.push(count);
        for (let i = 128536; i <= 204135; i++) {
            let gCode = Unicode2GBK_Map.get(i);
            if(gCode == undefined) alert(`u+${i} error`)
            Unicode2GBK_Uint32[count++] = gCode;
        }
        output += `Unicode连续编码\n${list.map(v=>`${v}`).join("\n")}\n`
        GBK2Unicode_myMap = new myMap(GBK2Unicode_Uint32, getUnicode);
        Unicode2GBK_myMap = new myMap(Unicode2GBK_Uint32, getGBK);
    }
    
    self.bufferToUint32Array = function(buffer) {
        let uint8 = new Uint8Array(buffer),
            uint32 = new Uint32Array(uint8.length >>> 2);
        for (i = 0, j = 0; i < uint8.length; i += 4) {
            let uInt32 = uint8[i] | uint8[i + 1] << 8 | uint8[i + 2] << 16 | uint8[i + 3] << 24;
            uint32[j++] = uInt32;
        }
        return uint32;
    }
    
    function compare(array1, array2) {
        if (array1.length != array2.length) {
            alert(`${array1.length} != ${array2.length}\narray1.length != array2.length`);
            return false;
        }
        else {
            for(let i = 0; i < array1.length; i++) {
                if (array1[i] != array2[i]) {
                    alert(`array1.length = ${array1.length}\narray2.length = ${array2.length}\n${array1[i]} != ${array2[i]}\narray1[${i}] != array2[${i}]`);
                    return false;
                }
            }
        }
        return true;
    }
    /*
    ----------------Unicode2GBK_Uint32  Uint32Array--------------
    codePoint               index               move
    0~55295                 0~55295             0
    57344~58852             55296~56804         -2048
    58854~65535             56805~63486         -2049
    128536~204135           63487~139086        -65049
    ------------------------------------------------------
    */
   function getGBK(codePoint) {
        if (codePoint <= 58852) {
            if (codePoint <= 55295) return this.Uint32[codePoint];
            else if(codePoint >= 57344) return this.Uint32[codePoint-2048];
        }
        else if(codePoint >= 58854){
            if (codePoint <= 65535) return this.Uint32[codePoint-2049];
            else if (codePoint >= 128536) return this.Uint32[codePoint-65049];
        }
    }
    /*
    ----------------GBK2Unicode_Uint32  Uint32Array--------------
        编码范围                                    
    0X00~0x7F
    0x81~0xFE,0x40~0xFE
    0x81~0x84,0x30~0x39,0x81~0xFE,0x30~0x39
    0x95~0x9A,0x30~0x39,0x81~0xFE,0x30~0x39
    
        gbkCode               index               move
    0x00~0x7F                   0~127               0
    0x8140~0xFEFE               128~24193           128
    0x81308130~0x8439FE39       24194~74593         24194
    0x95308130~0x9A39FE39       74594~150193        74594
    ------------------------------------------------------
    */
    function getUnicode(gbkCode) {
        if (gbkCode <= 0xFEFE) {
            if(gbkCode >= 0x8140) {
                let i = gbkCode >> 8 & 0xFF,
                    j = gbkCode & 0xFF;
                if (i >= 0x81 && i <= 0xFE && j >= 0x40 && j <= 0xFE) {
                    let index = (i - 0x81)*191 + j-0x40 + 128;
                    return this.Uint32[index];
                }
            }
            else if(gbkCode <= 0x7F) return gbkCode;
        }
        else if (gbkCode >= 0x81308130) {
            if(gbkCode <= 0x8439FE39) {
                let i = gbkCode >> 24 & 0xFF,
                    j = gbkCode >> 16 & 0xFF,
                    k = gbkCode >> 8 & 0xFF,
                    l = gbkCode & 0xFF;
                if (i >= 0x81 && i <= 0x84 && j >= 0x30 && j <= 0x39 
                    && k >= 0x81 && k <= 0xFE && l >= 0x30 && l <= 0x39)
                {
                    let index = (i-0x81)*12600+(j-0x30)*1260+(k-0x81)*10+(l-0x30)+24194;
                    return this.Uint32[index];
                }
            }
            else if(gbkCode >= 0x95308130) {
                let i = gbkCode >> 24 & 0xFF,
                    j = gbkCode >> 16 & 0xFF,
                    k = gbkCode >> 8 & 0xFF,
                    l = gbkCode & 0xFF;
                if (i >= 0x95 && i <= 0x9A && j >= 0x30 && j <= 0x39 &&
                    k >= 0x81 && k <= 0xFE && l >= 0x30 && l <= 0x39)
                {
                    let index = (i - 0x95) * 12600 + (j - 0x30) * 1260 + (k - 0x81) * 10 + (l - 0x30) + 74594;
                    return this.Uint32[index];
                }
            }
        }
    }
    
    class myMap {
        constructor(uint32, callback) {
            this.Uint32 = uint32;
            this.get = callback.bind(this);
        }
    }
    
    function checkUnicode2GBK_Map() {
        let result = true;
        Unicode2GBK_Map.forEach((value, key) => {
            if (value != Unicode2GBK_myMap.get(key)) result = false;
        })
        return result;
    }
    
    function checkGBK2Unicode_Map() {
        let result = true;
        GBK2Unicode_Map.forEach((value, key) => {
            if (value != GBK2Unicode_myMap.get(key)) result = false;
        })
        return result;
    }
    
    function _testSpeed(map) {
        let code, maxI = 15, maxJ = 65535;
        for(let i = 0; i < 15; i++) {
            for(let j = 0; j < maxJ; j++) {
                code = map.get(i+j)
            }
        }
        return `convert ${maxI*maxJ} char`;
    }
    
    function testSpeedUnicode2GBK() {
        let str = "",
            sTime = new Date().getTime();
        str += `Unicode2GBK_Map:\n ${_testSpeed(Unicode2GBK_Map)}\n Time ${new Date().getTime() - sTime}ms\n`
    
        sTime = new Date().getTime();
        str += `Unicode2GBK_myMap:\n ${_testSpeed(Unicode2GBK_myMap)}\n Time ${new Date().getTime() - sTime}ms\n`
        alert(str)
    }
    
    function testSpeedGBK2Unicode() {
        let str = "",
            sTime = new Date().getTime();
        str += `GBK2Unicode_Map:\n ${_testSpeed(GBK2Unicode_Map)}\nTime ${new Date().getTime() - sTime}ms\n`
    
        sTime = new Date().getTime();
        str += `GBK2Unicode_myMap:\n ${_testSpeed(GBK2Unicode_myMap)}\nTime ${new Date().getTime() - sTime}ms\n`
        alert(str)
    }

} catch (e) { alert(e.stack) }
