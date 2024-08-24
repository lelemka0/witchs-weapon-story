const roleDir = "../../Story-Pages/resources/role";
const faceDir = "../../Story-Pages/resources/role/face";
const outputDir = "./outputs";
const destRoleBaseDir = "/resources/role";
const destFaceBaseDir = "/resources/role/face";

const fs = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');

(async () => {
    await fs.readdir(roleDir, { recursive: false })
        .then(async files => {
            for (const filename of files) {
                let file;
                if (file = filename.match(/^role(\d+)\.png\.meta$/)) {
                    const _role = {
                        SN: file[1],
                        name: null,
                        path: path.join(destRoleBaseDir, filename.replace(/\.meta$/, "")),
                        face: null,
                        _comment: null,
                        options: {},
                    };
                    /**
                     * 立绘相对背景明显偏大
                     * 缩放0.75合适
                     * 在找到相关坐标和缩放数值前，暂用
                     * lesson文件和role.prefab中有坐标数据 不清楚如何使用
                     */
                    _role.options.scale = 0.75;

                    const roleMetaContent = await fs.readFile(path.join(roleDir, filename), { encoding: 'utf8' });
                    const parsedRoleMeta = YAML.parse(roleMetaContent);

                    /* 看起来都是空的 */
                    _role.name = parsedRoleMeta.TextureImporter.name;

                    await fs.readFile(path.join(faceDir, `face${_role.SN}.prefab`), { encoding: 'utf8' })
                        .then(facePrefabContent => {
                            _role.face = { path: path.join(destFaceBaseDir, `face${_role.SN}.png`), differences: {} };
                            const parsedFacePrefab = YAML.parseAllDocuments(facePrefabContent);
                            //console.log(parsedFacePrefab[2].toJS());
                            parsedFacePrefab[2].toJS().MonoBehaviour?.mSprites?.forEach(item => {
                                const _item = {};
                                Object.entries(item).forEach(([k,v]) => {
                                    //YAML将开头为0的非明确字符串理解为八进制数 将y理解为bool:true
                                    switch(k){
                                        case 'name':
                                            if (typeof v === 'number') v = `0${v.toString(8)}`;
                                            break;
                                        case 'true':
                                            k = 'y';
                                            break;
                                    }
                                    _item[k] = v;
                                });

                                const faceStr = _item.name.substring(_item.name.length - 2);
                                _role.face.differences[faceStr] = _item;
                            });
                        }).catch(e => console.log(`Failed face: ${_role.SN}`, e));

                    await fs.writeFile(path.join(outputDir, `role.${_role.SN}.yaml`), YAML.stringify(_role));
                    console.log(`parsed ${_role.SN}`);
                }
            }
        });
})();
