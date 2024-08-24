//const m_assets_list_file = "../hot_updated.0/com.shuiqinling.ww.android.cn00/files/assetbundle/m.assets_list.txt";
const m_assets_list_file = "./m.assets_list.txt";
const base_url = "http://cdn-android-release.witchweapon.com/"
const base_output = "./outputs"

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const axios = require('axios');

fs.readFile(m_assets_list_file, { encoding: 'utf8' })
    .then(async text => {
        for (const line of text.split(/[\s\r\n]+/)) {
            const ctx = line.split(/[=:]/);
            if (ctx.length == 3) {
                const hash = ctx[0], file = ctx[1], size = parseInt(ctx[2]);
                await axios({
                    method: 'get',
                    url: path.join(base_url, hash),
                    responseType: 'arraybuffer',
                }).then(async res => {
                    const buf = Buffer.from(res.data, 'binary');
                    if (buf.length !== size)
                        console.warn("Wrong Size!!!");
                    const dest = path.join(base_output, file);
                    await fs.mkdir(path.parse(dest).dir, { recursive: true });
                    await fs.writeFile(dest, buf);
                    console.log(`Saved: ${dest}`);
                }).catch(e => console.log(`Failed: ${ctx}`));
            }
        }
    })
    .catch(console.error);