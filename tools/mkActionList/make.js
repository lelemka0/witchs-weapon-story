const fs = require('node:fs/promises');
const path = require('node:path');
const YAML = require('yaml');
const decrypt = require('../decryptAssetBytes/decrypt');

module.exports = async (lessonFile, sentenceBase, __serialized = false) => {
    let lessonTree;
    if (!__serialized) {
        const lessonFileContent = await fs.readFile(lessonFile, { encoding: 'utf8' });
        const lesson = YAML.parse(lessonFileContent);
        lessonTree = JSON.parse(lesson.MonoBehaviour._serializedGraph);
        //console.log(lessonTree)
    }
    else lessonTree = JSON.parse(lessonFile);

    const roles = [];
    lessonTree.derivedData.claimInfo.role?.forEach(role => roles.push({ name: role.name, SN: role.roleSN }));
    //console.log(roles)

    const actionList = [];
    for (const node of lessonTree.nodes) {
        const _obj = { _comment: node._comment || null, actions: [] };
        actionList.push(_obj);
        if (actionList.length == 1 && parseInt(lessonTree.derivedData.claimInfo.defaultBGM) > 0)
            _obj.actions.push({ action: 'playBGM', soundId: lessonTree.derivedData.claimInfo.defaultBGM, _comment: "this.defaultBGM" });
        ['_a4cmdActionList', '_b4cmdActionList'].forEach(cmdNodeName => node._roundInfo?.[cmdNodeName]?.actions?.forEach(action => {
            switch (action.$type) {
                case 'NodeCanvas.Tasks.Actions.C_Begin':
                    if (!!action.bgPicStr)
                        _obj.actions.push({ action: 'background', bgPic: action.bgPicStr + ".png" });
                    break;
                case 'NodeCanvas.Tasks.Actions.PlayBGM':
                    _obj.actions.push({ action: 'playBGM', soundId: String(action.sndID) });
                    break;
                case 'NodeCanvas.Tasks.Actions.StopBGM':
                    _obj.actions.push({ action: 'stopBGM' });
                    break;
                case 'NodeCanvas.Tasks.Actions.PlayVideo':
                    _obj.actions.push({ action: 'playVideo', videoId: action.Name });
                    break;
                case 'NodeCanvas.Tasks.Actions.C_changeBG':
                    _obj.actions.push({ action: 'background', bgPic: action.picName + ".png" });
                    break;
                case 'NodeCanvas.Tasks.Actions.DelayTime':
                    _obj.actions.push({ action: 'delay', second: action.delaytime });
                    break;
                case 'NodeCanvas.Tasks.Actions.C_roleSpeak':
                    _obj.actions.push({ action: 'roleSpeak', roleIdx: action._roleIdx, faceSN: action.faceStr, sentenceIdx: action.sentenceIdx });
                    break;
                case 'NodeCanvas.Tasks.Actions.C_speakAside':
                    _obj.actions.push({ action: 'asideSpeak', sentenceIdx: action.sentenceIdx });
                    break;
                case 'NodeCanvas.Tasks.Actions.C_roleOut':
                    _obj.actions.push({ action: 'roleOut', roleIdx: action.roleIdx });
                    break;
                case 'NodeCanvas.Tasks.Actions.C_end':
                    /* Nothing to do here */
                    break;
                case 'NodeCanvas.Tasks.Actions.EndLesson':
                    _obj.actions.push({ action: 'end' });
                    break;
                default:
                    console.warn('unsupported type of action: ' + action.$type);
                    break;
            }
        }));
    }
    //console.log(actionList);

    const sentences = [];

    const sentenceFile = lessonTree.derivedData.sentenceFName.replace(/\.txt$/, ".asset");
    await fs.readFile(path.join(sentenceBase, sentenceFile), { encoding: 'utf8' })
        .then(async content => {
            const encryptedSentence = YAML.parse(content);
            try {
                const decryptedSentenceBuf = decrypt(encryptedSentence.MonoBehaviour.bytes);
                await fs.writeFile("./test.output", decryptedSentenceBuf);
                //console.log(decryptedSentenceBuf.toString())

                for (const line of decryptedSentenceBuf.toString().split('\n')) {
                    const _split = line.split('\t');
                    //console.log(_split)
                    if (_split.length < 3) continue;
                    const _obj = {
                        SN: parseInt(_split[0]),
                        name: _split[1],
                        content: {
                            'zh-Hans': _split[2],
                            'zh-Hant': _split[3],
                            'jp': _split[4],
                            'kr': _split[5],
                            'en': _split[6],
                        },
                    }
                    sentences.push(_obj);
                }
            } catch (e) {
                console.error(e);
            }
        }).catch(console.error);

    //console.log(sentences)

    return { roles, actionList, sentences };
};