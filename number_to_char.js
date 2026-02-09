function numberToChar(num) {
    if(num < 0 || num > 0x10FFFF){
        throw new RangeError("الرقم خارج نطاق Unicode الصالح");
    }
    return String.fromCodePoint(num);
}

// أمثلة:
console.log(numberToChar(65));        // A
console.log(numberToChar(945));       // α (ألفا يونانية)
console.log(numberToChar(0x4F60));    // 你 (حرف صيني)
console.log(numberToChar(0x1F600));   // 😀 (إيموجي)
