const soundAsset = "../../Exported/latest_mixed/ExportedProject/Assets/_temp_config/config/clientexel/Sound.asset";

const fs = require('node:fs/promises');
const YAML = require('yaml');
const decrypt = require('../decryptAssetBytes/decrypt');

(async () => {
    const file = await fs.readFile(soundAsset, { encoding: 'utf8' });
    const yaml = YAML.parse(file);
    const encrypted = yaml.MonoBehaviour.bytes;
    const decrypted = decrypt(encrypted);

    //console.log(decrypted.toString());

    const result = [];
    decrypted.toString().split('\n').forEach((line,idx)=>{
        if(idx <=3) return null;
        const split = line.split(',');
        //bgm only type === 2
        if(split[2] != "2") return null;
        const _obj = {
            id: split[0],
            path: split[1] + '.ogg',
            _comment: split[7],
        }
        result.push(_obj);
    });

    await fs.writeFile("./test.output", YAML.stringify(result));
})();