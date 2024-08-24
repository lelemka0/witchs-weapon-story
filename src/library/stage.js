define([], () => {
    class Layer {
        constructor() {
            this.initialized = false;
            this.width = undefined;
            this.height = undefined;
            this.x = undefined;
            this.y = undefined;
            this.display = undefined;

            this.canvas = null;

            this._init();
        }
        _init() {
            this.canvas = document.createElement('canvas');
            this.x = 0;
            this.y = 0;
            this.toDisplay(false);
        }
        _cal() {
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.initialized = true;
        }
        size(width, height) {
            this.width = width;
            this.height = height;
            this._cal();
            return this;
        }
        location(x, y) {
            this.x = x;
            this.y = y;
            return this;
        }
        toDisplay(bool) {
            this.display = bool;
            return this;
        }
        drawImage(...Args) {
            this.canvas.getContext('2d').drawImage(...Args);
            return this;
        }
        renderBlob(blob, ...Args) {
            const img = new Image;
            return new Promise(resolve => {
                img.onload = () => resolve(this.drawImage(img, ...Args));
                img.src = URL.createObjectURL(blob);
            });
        }
        clear() {
            this.canvas.getContext('2d').clearRect(0, 0, this.width, this.height);
            return this;
        }
    }
    class Stage {
        constructor(options) {
            this.options = Object.assign({
                width: undefined,
                height: undefined,
                use_buffer: false,
                auto_refresh: false,
                refresh_rate: 60,
                auto_fullwindow: false,
            }, options);
            for (const [required, type] of Object.entries({ width: 'number', height: 'number' }))
                if (typeof this.options[required] !== type)
                    throw "invalid options";

            this.canvas = null;
            this.buffer = null;
            this.layers = null;

            this.mounted = null;
            this.directWrite = null;
        }
        init() {
            this.canvas = document.createElement('canvas');
            this.directWrite = this.canvas;
            this.canvas.width = this.options.width;
            this.canvas.height = this.options.height;

            this.layers = new Map();

            this._setup_buffer();
            this._setup_auto_refresh();
            this._setup_auto_fullwindow();
            return this;
        }
        _setup_buffer() {
            if (this.options.use_buffer) {
                this.buffer = document.createElement('canvas');
                this.directWrite = this.buffer;
                this.buffer.width = this.options.width;
                this.buffer.height = this.options.height;

                this.apply = () => {
                    this.canvas.getContext('2d').drawImage(this.buffer, 0, 0);
                    return this;
                };
            }
        }
        _setup_auto_refresh() {
            if (this.options.auto_refresh)
                this.auto_refresh = setInterval(this.apply.bind(this), parseInt(1000 / this.options.refresh_rate));
        }
        _setup_auto_fullwindow() {
            if (this.options.auto_fullwindow) {
                let _reset; (_reset = () => {
                    const { innerWidth, innerHeight } = window;
                    if (innerWidth / innerHeight > this.options.width / this.options.height)
                        this.canvas.style.transform = `scale(${innerHeight / this.options.height})`;
                    else this.canvas.style.transform = `scale(${innerWidth / this.options.width})`;
                })();
                this.auto_fullwindow = window.addEventListener('resize', _reset);
            }
        }
        mount(DOM) {
            if (DOM instanceof HTMLElement) this.mounted = DOM;
            else this.mounted = document.querySelector(DOM);
            this.mounted.replaceChildren(this.canvas);
            return this;
        }
        layer(id) {
            if (this.layers.has(id))
                return this.layers.get(id);
            const _layer = new Layer();
            _layer.remove = () => this.layers.delete(id);
            this.layers.set(id, _layer);
            return _layer;
        }
        update() {
            const _ctx = this.directWrite.getContext('2d');
            _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
            this.layers.forEach(layer => {
                if (layer.initialized && layer.display)
                    _ctx.drawImage(layer.canvas, layer.x, layer.y);
            });
            return this;
        }
    }
    return Stage;
});
