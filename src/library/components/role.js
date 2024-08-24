define(['stage', "components/const"], (Stage, CONST) => {
    class singleRole {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.role = null;
            this._face = null;
        }
        async init(blob, face, _fnGetFaceBlob) {
            this.role = new Stage({ width: this.width, height: this.height }).init();
            const roleLayer = this.role.layer("main").size(this.width, this.height).location(0, 0).toDisplay(true);
            await roleLayer.renderBlob(blob, 0, 0);
            if (face instanceof Object) {
                this._face = { ...face, blob: await _fnGetFaceBlob() };
                this.role.layer("face").size(this._face.width, this._face.height).location(this._face.x, this._face.y).toDisplay(false);
            }
            return this;
        }
        async applyFace(SN) {
            const _selectFace = this._face.differences[SN];
            if (!_selectFace) throw ["selected face not found", SN, this];
            await this.role.layer("face").renderBlob(this._face.blob, _selectFace.x, _selectFace.y, _selectFace.width, _selectFace.height, 0, 0, _selectFace.width, _selectFace.height)
                .then(_layer => _layer.toDisplay(true));
            return this;
        }
        update() {
            this.role.update();
            return this;
        }

    }
    class role {
        constructor(layer, classifiedResInterpreter) {
            this.layer = layer;
            this.classifiedResInterpreter = classifiedResInterpreter;

            this.stage = new Stage({ width: this.layer.width, height: this.layer.height }).init();
        }
        async update() {
            const _Iterator = this.stage.layers.values();
            let _c; const _fnCommon = () => {
                _c.role.update();
                const _ctx = _c.canvas.getContext('2d');
                _ctx.clearRect(0, 0, _c.width, _c.height);
                if (_c.height >= this.layer.height)
                    _c.y = 0;
                else _c.y = this.layer.height - _c.height - _c.role.config.options?.offset || 0;
                if (!_c.role.focus)
                    _ctx.filter = "grayscale(0.3)";
                _ctx.drawImage(_c.role.role.canvas, 0, 0, _c.width, _c.height);
                _ctx.filter = "none";
            };
            switch (this.stage.layers.size) {
                case 1:
                    _fnCommon((_c = _Iterator.next().value).x = (this.layer.width - _c.width) / 2);
                    break;
                case 2:
                    _fnCommon((_c = _Iterator.next().value).x = 10);
                    _fnCommon((_c = _Iterator.next().value).x = this.layer.width - _c.width - 10);
                    break;
                case 3:
                    _fnCommon((_c = _Iterator.next().value).x = 10);
                    _fnCommon((_c = _Iterator.next().value).x = (this.layer.width - _c.width) / 2);
                    _fnCommon((_c = _Iterator.next().value).x = this.layer.width - _c.width - 10);
                    break;
            }
            this.stage.update();
            this.layer.drawImage(this.stage.canvas, 0, 0);
            return this;
        }
        async hide() {
            this.layer.toDisplay(false);
            return this;
        }
        async _getRole(idx) {
            const _selectRole = this.classifiedResInterpreter.lesson.roles?.[idx]?.detail;
            if (!_selectRole) throw ["select role not found", action, this];
            if (!this.stage.layers.has(_selectRole.SN)) {
                const _scale = _selectRole.options.scale || 1;
                const _layer = this.stage.layer(_selectRole.SN).size(_selectRole.width * _scale, _selectRole.height * _scale).toDisplay(true);
                const _role = await new singleRole(_selectRole.width, _selectRole.height).init(
                    this.classifiedResInterpreter.resource.blob(this.classifiedResInterpreter._cal_id(CONST.RESID_PREFIX_ROLE, _selectRole.SN)),
                    _selectRole.face,
                    () => this.classifiedResInterpreter.resource.blob(this.classifiedResInterpreter._cal_id(CONST.RESID_PREFIX_FACE, _selectRole.SN))
                );
                _layer.role = _role;
                _role.config = _selectRole;
                _role.focus = false;
                _role.beFocus = () => _role.focus = true;
                _role.remove = () => this.stage.layers.delete(_selectRole.SN);
            }
            return this.stage.layer(_selectRole.SN).role;
        }
        async show(action) {
            const _role = await this._getRole(action.roleIdx);
            if (!!action.faceSN)
                _role.applyFace(action.faceSN);
            _role.beFocus();
            this.layer.toDisplay(true);
            return this.update();
        }
        async out(action) {
            (await this._getRole(action.roleIdx))?.remove();
            return this.update();
        }
    }
    return role;
});