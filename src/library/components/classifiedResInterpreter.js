define(['path', 'yaml', 'resource', 'components/const'], (Path, YAML, { resource: Resource, CONST: _CONST_Resource }, CONST) => {
    const CONFIG_BASEDIR = "/config";
    const YAML_SOUND_BGM = "sound.bgm";
    const YAML_SUFFIX = ".yaml";
    const YAML_LESSON_PREFIX = "lesson.";
    const YAML_ROLE_PREFIX = "role.";

    const RES_BASEDIR = "/resources";
    /* deprecated : use full path in lessonFile later */
    const RES_BACKGROUND_DIR = Path.join(RES_BASEDIR, 'background');
    //const RES_BGM_DIR = Path.join(RES_BASEDIR, 'sounds/bgm');
    //const RES_ROLE_DIR = Path.join(RES_BASEDIR, 'role');
    //const RES_FACE_DIR = Path.join(RES_ROLE_DIR, 'face');

    const STATUS_NEXT_OK = 1;
    const STATUS_NEXT_PENGING = 0;
    const STATUS_NEXT_FAIL = -1;
    const STATUS_NEXT_END = 9;

    class classifiedResInterpreter {
        constructor() {
            this.initialized = false;
            this.loaded = false;

            this.lessonId = null;
            this.lesson = null;
            this.bgmList = null;
            this.stepLength = null;
            this.currentStep = null;
            this.stepResIds = null;

            this.resource = new Resource();
        }
        _cal_url(_t, _id = "") {
            return Path.join(CONFIG_BASEDIR, `${_t}${_id}${YAML_SUFFIX}`);
        }
        _cal_id(_t, _id) {
            return Path.join(_t, _id);
        }
        async init(lessonId) {
            this.lessonId = lessonId;
            const _resConfigId = `config/lesson/${this.lessonId}`;
            const _resBgmListId = "config/sound/bgm";
            return await this.resource.load([
                { id: _resConfigId, url: this._cal_url(YAML_LESSON_PREFIX, this.lessonId) },
                { id: _resBgmListId, url: this._cal_url(YAML_SOUND_BGM) },
            ]).then(async results => {
                for (const r of results)
                    if (r.value !== _CONST_Resource.STATUS_OK)
                        return Promise.reject(["load base configs failed", results]);
                this.lesson = YAML.parse(this.resource.get(_resConfigId).toString());
                this.stepLength = this.lesson.actionList.length;
                this.currentStep = 0;
                this.bgmList = {};
                YAML.parse(this.resource.get(_resBgmListId).toString()).forEach(item => this.bgmList[item.id] = item);

                await this._initRoles();
                this.initialized = true;
                //console.log(this);
                return this;
            });
        }

        async _initRoles() {
            const _list = [];
            this.lesson.roles.forEach(({ SN }) => _list.push({ id: `config/role/${SN}`, url: this._cal_url(YAML_ROLE_PREFIX, SN) }));
            return await this.resource.load(_list)
                .then(results => {
                    for (const r of results)
                        if (r.value !== _CONST_Resource.STATUS_OK)
                            return Promise.reject(["load role configs failed", results]);
                    this.lesson.roles.forEach(({ SN }, idx) => this.lesson.roles[idx].detail = YAML.parse(this.resource.get(`config/role/${SN}`).toString()));
                });
        }

        async _loadRoles() {
            const _list = [];
            this.lesson.roles.forEach(({ SN, detail }) => {
                _list.push({ id: this._cal_id(CONST.RESID_PREFIX_ROLE, SN), url: detail.path });
                if (detail.face instanceof Object)
                    _list.push({ id: this._cal_id(CONST.RESID_PREFIX_FACE, SN), url: detail.face.path });
            });
            return await this.resource.load(_list);
        }

        load() {
            this.stepResIds = [];
            this._loadRoles();
            const _ids = [], _urls = [];
            for (const { actions } of this.lesson.actionList) {
                const _resIdList = [];
                const _add = (_id, _url) => {
                    _resIdList.push(_id);
                    if (!_ids.includes(_id)) {
                        _ids.push(_id);
                        _urls.push(_url);
                    }
                };
                this.stepResIds.push(_resIdList);
                for (const action of actions) {
                    switch (action.action) {
                        case 'background':
                            if (typeof action.bgPic === 'string')
                                _add(this._cal_id(CONST.RESID_PREFIX_BACKGROUND, action.bgPic), this._cal_id(RES_BACKGROUND_DIR, action.bgPic));
                            break;
                        case 'playBGM':
                            if (Object.keys(this.bgmList).includes(action.soundId))
                                _add(this._cal_id(CONST.RESID_PREFIX_SOUND_BGM, action.soundId), this.bgmList[action.soundId].path);
                            else throw ["required BGM not found", action, this];
                            break;
                        case 'roleSpeak':
                            _resIdList.push(this._cal_id(CONST.RESID_PREFIX_ROLE, this.lesson.roles[action.roleIdx].SN));
                            if (typeof action.faceSN === 'string')
                                _resIdList.push(this._cal_id(CONST.RESID_PREFIX_FACE, this.lesson.roles[action.roleIdx].SN));
                            break;
                    }
                }
            }
            this.resource.load(_ids.map((id, i) => ({ id, url: _urls[i] })));
            this.loaded = true;
            return this;
        }

        require(idList) {
            idList.forEach(id => this.stepResIds[0].push(id));
        }

        next() {
            if (this.currentStep < this.stepLength)
                return this.check(this.currentStep++);
            return [[STATUS_NEXT_END]]
        }

        get() {
            return this.lesson.actionList[this.currentStep - 1] || null;
        }

        async* check(stepIdx) {
            try {
                for await (const t of this.resource.wait(this.stepResIds[stepIdx])) {
                    console.log(t)
                    yield ([STATUS_NEXT_PENGING, `${t.current}/${t.total}`, t.id]);
                }
            }
            catch (e) {
                console.log(e)
                yield ([STATUS_NEXT_FAIL, `${e.current}/${e.total}`, e.id]);
            }
            yield ([STATUS_NEXT_OK]);
        }
    }
    return {
        classifiedResInterpreter, CONST: {
            STATUS_NEXT_OK,
            STATUS_NEXT_PENGING,
            STATUS_NEXT_FAIL,
            STATUS_NEXT_END,
        }
    };
});