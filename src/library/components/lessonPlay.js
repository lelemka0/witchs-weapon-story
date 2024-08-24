define(['audio', 'video', 'resource', "components/const", "components/classifiedResInterpreter", "components/role", "components/conversation"], (
    Audio, Video,
    { resource: Resource, CONST: _CONST_Resource },
    CONST,
    { classifiedResInterpreter: ClassifiedResInterpreter, CONST: _CONST_ClassifiedResInterpreter },
    Role, Conversation,
) => {
    class lessonPlay {
        constructor(stage, onReady) {
            this.ready = false;
            this.stage = stage;
            this.onReady = onReady || (() => { });

            this.classifiedResInterpreter = null;

            this.loading = null;
            this.bg = null;
            this.role = null;
            this.conversation = null;

        }
        init(lessonId) {
            this.classifiedResInterpreter = new ClassifiedResInterpreter();
            return this.classifiedResInterpreter.init(lessonId).then(instance => {
                instance.load();
                this.loading = this.stage.layer('loading').size(CONST.WIDTH, CONST.HEIGHT).location(0, 0).toDisplay(true);
                this.bg = this.stage.layer('bg').size(CONST.WIDTH, CONST.HEIGHT).location(0, 0);
                this.role = new Role(this.stage.layer('role').size(CONST.WIDTH, CONST.HEIGHT).location(0, 0), this.classifiedResInterpreter);
                this.bgm = new Audio();
                this.soundEffect = new Audio();
                this.conversation = new Conversation(this.stage.layer('conversation').size(CONST.WIDTH, CONST.HEIGHT).location(0, 0), this.classifiedResInterpreter, () => this.stage.update());

                return this;
            });
        }
        async _setup_listener() {

        }
        async _loading() {
            const _resources = new Resource();
            const _list = [
                { id: "loading/bg/AEGIS", url: "/resources/loading/bg/AEGIS.png" },
                { id: "loading/bar/bottom", url: "/resources/loading/LoadingBarBg.png" },
                { id: "loading/bar/top", url: "/resources/loading/LoadingBar.png" },
                { id: "loading/bar/header", url: "/resources/loading/LoadingBarHeader.png" },
            ];
            _resources.load(_list);
            console.log(_resources)
            for await (const t of _resources.wait(["loading/bg/AEGIS"])) { }
            try {
                await this.loading.renderBlob(_resources.blob("loading/bg/AEGIS"), 0, 0);
                //TODO: loading scene
                const _ctx = this.loading.canvas.getContext('2d');
                _ctx.fillStyle = "#FFFFFF";
                _ctx.font = "36px serif";
                _ctx.fillText("加载界面还没做", 70, 70);
                _ctx.fillText("长时间停留在此界面请刷新重试", 70, 160);
                this.stage.update();
                this.conversation.init();
                await this.onReady(this.ready = true);
                for await (const t of this.classifiedResInterpreter.next()) {
                    if (t[0] === _CONST_ClassifiedResInterpreter.STATUS_NEXT_PENDING) {
                        console.log(t)
                    }
                }
                this.loading.toDisplay(false);
                this.bg.toDisplay(true);
            } catch (e) {
                return Promise.reject(e)
            }
        }
        async start() {
            await this._loading();
            const _cal_id = this.classifiedResInterpreter._cal_id;
            let _step; while ((_step = this.classifiedResInterpreter.get()) !== null) {
                for (const action of _step.actions) {
                    switch (action.action) {
                        case 'playBGM':
                            this.bgm.play(this.classifiedResInterpreter.resource.blob(_cal_id(CONST.RESID_PREFIX_SOUND_BGM, action.soundId)));
                            break;
                        case 'stopBGM':
                            this.bgm.stop();
                            break;
                        case 'background':
                            await this.bg.renderBlob(this.classifiedResInterpreter.resource.blob(_cal_id(CONST.RESID_PREFIX_BACKGROUND, action.bgPic)), 0, 0);
                            this.stage.update();
                            break;
                        case 'roleSpeak':
                            await this.role.show(action).then(() => this.stage.update());
                            await this.conversation.speak(action.sentenceIdx);
                            break;
                        case 'asideSpeak':
                            await this.role.hide().then(() => this.stage.update());
                            await this.conversation.speak(action.sentenceIdx);
                            break;
                        case 'roleOut':
                            await this.role.out(action).then(() => this.stage.update());
                            break;
                        default:
                            console.error("unknown action", action, _step);
                    }
                }
                for await (const t of this.classifiedResInterpreter.next()) {
                    console.log(t);
                    if (t[0] === _CONST_ClassifiedResInterpreter.STATUS_NEXT_END) {
                        alert("END");
                        return;
                    }
                }
            }
        }

        async _parse(actions) {

        }
    }
    return lessonPlay;
});
