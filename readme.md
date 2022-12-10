TextCoder  
gb18030 与 utf-8 编码互转

TextCoder.js 用Map映射编码表
<script src = "TextCoder.js"></script>

TextCoder_bin.js 用Uint32Array映射编码表，速度更快
<script src = "TextCoder_bin.js"></script>

decode
TextCoder.decode([Uint8Array],"gb18030")
TextCoder.decode([Uint8Array],"utf-8")

encode
TextCoder.encode(String,"gb18030")
TextCoder.encode(String,"utf-8")

string2Code
TextCoder.string2Code(String,"gb18030")
TextCoder.string2Code(String,"Unicode")

code2String  
TextCoder.code2String([gbkCode,gbkCode,...],"gb18030")
TextCoder.code2String([codePoint,codePoint,...],"Unicode")

putUTF8Buffer
TextCoder.putUTF8Buffer(gbkBuffer, gStart, gEnd, utf8Buffer, uStart)

putGBKBuffer
TextCoder.putGBKBuffer(utf8Buffer, uStart, uEnd, gbkBuffer, gStart)

gbkBuffer2UTF8Buffer
TextCoder.gbkBuffer2UTF8Buffer([Uint8Array])

utf8Buffer2GBKBuffer
TextCoder.utf8Buffer2GBKBuffer([Uint8Array])
        
