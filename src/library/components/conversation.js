define(['stage', "components/const"], (Stage, CONST) => {
    const setting = {
        width: 1024,
        height: 172,
        x: 0,
        y: 404,
        resources: {
            textBoxBG: {
                url: "/resources/conversation/TextboxBG.png",
            },
            ConversationTextUI: {
                url: "/resources/conversation/ConversationTextUI.png",
            },
            textFont: {
                url: "/resources/font/HYQiHei-50S.otf",
            },
        },
        layout: {
            textBoxBG: {
                type: "image",
                image: {
                    resource: "textBoxBG",
                    width: 1298,
                    height: 157,
                    x: 0,
                    y: 0,
                },
                scale: 0.75,
                x: 25.25,
                y: 36,
            },
            roleNameBox: {
                type: "image",
                image: {
                    resource: "ConversationTextUI",
                    width: 330,
                    height: 60,
                    x: 617,
                    y: 448,
                },
                scale: 0.75,
                x: 180,
                y: 0,
            },
            roleNameText: {
                type: "text",
                style: {
                    font: "25px sans-serif",
                    fillStyle: "white",
                },
                maxLine: 1,
                x: 210,
                y: 5,
                width: 230, //200
                height: 32,
            },
            speakText: {
                type: "text",
                style: {
                    font: "25px sans-serif",
                    fillStyle: "white",
                },
                maxLine: 2,
                lineSpace: 20,
                x: 187,
                y: 56,
                width: 650,
                height: 85,
            },
            nextButton: {
                type: "script",
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                script: layer => {

                },
            },
        },
    };
    class conversation {
        constructor(layer, classifiedResInterpreter, onUpdate) {
            this.layer = layer;
            this.classifiedResInterpreter = classifiedResInterpreter;
            this.onUpdate = onUpdate;

            this.stage = null;
            this.rendered = false;

            //i18n planned but use simplified Chinese now
            this.lang = "zh-Hans";

            this.intervalTime = 100;
        }
        _cal_id(name) {
            return "conversation/" + name;
        }
        init() {
            this.stage = new Stage({ width: setting.width, height: setting.height }).init();
            const _list = [];
            Object.entries(setting.resources).forEach(([name, _obj]) => _list.push({ id: this._cal_id(name), url: _obj.url }));
            this.classifiedResInterpreter.resource.load(_list);
            this.classifiedResInterpreter.require(_list.map(r => r.id));
            return this;
        }
        update() {
            this.stage.update();
            this.layer.clear().drawImage(this.stage.canvas, setting.x, setting.y).toDisplay(true);
            this.onUpdate();
            return this;
        }
        async _render() {
            if (!this.rendered) {
                for (const [name, _s] of Object.entries(setting.layout))
                    switch (_s.type) {
                        case 'image': {
                            const _layer = this.stage.layer(name).size(_s.image.width * _s.scale, _s.image.height * _s.scale).location(_s.x, _s.y).toDisplay(true);
                            await _layer.renderBlob(this.classifiedResInterpreter.resource.blob(this._cal_id(_s.image.resource)), _s.image.x, _s.image.y, _s.image.width, _s.image.height, 0, 0, _layer.width, _layer.height);
                            break;
                        }
                        case 'text': {
                            const _ctx = this.stage.layer(name).size(_s.width, _s.height).location(_s.x, _s.y).toDisplay(true).canvas.getContext('2d');
                            Object.entries(_s.style).forEach(([property, value]) => _ctx[property] = value);
                            break;
                        }
                        case 'script': {
                            //todo next button
                            break;
                        }
                    }
                this.rendered = true;
            }
            return this;
        }
        async speak(sentenceIdx) {
            await this._render();
            const roleNameText = this.stage.layer("roleNameText").clear();
            const roleNameTextCtx = roleNameText.canvas.getContext('2d');
            const speakTextCtx = this.stage.layer("speakText").clear().canvas.getContext('2d');
            const currentSentence = this.classifiedResInterpreter.lesson.sentences[sentenceIdx];
            if (!currentSentence instanceof Object)
                throw (["sentence not found", sentenceIdx, this.classifiedResInterpreter.lesson]);
            if (typeof currentSentence.name === 'string' && currentSentence.name != '') {
                roleNameTextCtx.fillText(currentSentence.name, 0, parseInt(roleNameTextCtx.font.match(/(\d+)px/)[1]));
                roleNameText.toDisplay(true);
            }
            else roleNameText.toDisplay(false);
            const _textString = currentSentence.content[this.lang];
            const _textPx = parseInt(speakTextCtx.font.match(/(\d+)px/)[1]);
            let _charIdx = 0, _printed = "", _x = 0, _line = 0; while (_charIdx < _textString.length) {
                const _printing = _textString.charAt(_charIdx++);
                if (_printing === '\\') {
                    switch (_textString.charAt(_charIdx++)) {
                        case 'n':
                            _x = 0; _line++; break;
                    }
                    continue;
                }
                if (_printing === '[') {
                    let _styleStr = "", _currentChar;
                    while ((_currentChar = _textString.charAt(_charIdx++)) !== ']')
                        _styleStr += _currentChar;
                    //color only
                    if (_styleStr === '-')
                        speakTextCtx.fillStyle = setting.layout["speakText"].style.fillStyle;
                    else
                        speakTextCtx.fillStyle = `#${_styleStr}`;
                    continue;
                }
                const _calCtx = document.createElement('canvas').getContext('2d');
                _calCtx.font = speakTextCtx.font;
                const _printingWidth = _calCtx.measureText(_printing).width;
                const _printingX = _x + _printingWidth <= setting.layout["speakText"].width ? _x : (() => { _line++; return _x = 0; })();
                const _printingY = _line * (_textPx + setting.layout["speakText"].lineSpace) + _textPx;
                _printed += _printing;
                _x += _printingWidth;
                /*
                const _x = _charIdx % setting.layout["speakText"].wordPerLine * _textPx;
                const _y = Math.floor(_charIdx / setting.layout["speakText"].wordPerLine) * (_textPx + setting.layout["speakText"].lineSpace) + _textPx;
                */
                speakTextCtx.fillText(_printing, _printingX, _printingY);

                this.update();
                await new Promise(resolve => setTimeout(resolve, this.intervalTime));
            }
        }
    }
    return conversation;
});