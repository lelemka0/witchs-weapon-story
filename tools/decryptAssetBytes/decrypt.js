module.exports = hexString => {
    let buf = Buffer.from(hexString, 'hex');
    if(buf.subarray(0,3).equals(Buffer.from([0x10, 0x44, 0x40])))
        buf = buf.subarray(3);
    //console.log(buf)
    for (let i = 0; i < buf.length; i++)
        buf[i] = ~buf[i];

    return buf;
};
