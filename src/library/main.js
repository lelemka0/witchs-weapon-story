(async () => {
    requirejs.config({
        paths: {
            "axios": "https://cdn.jsdelivr.net/npm/axios@latest/dist/axios.min",
            "yaml": "https://eemeli.org/yaml-playground/yaml.min",
            "buffer": "https://cdn.jsdelivr.net/npm/buffer@latest/index.min",
            "path": "https://cdn.jsdelivr.net/npm/path-browserify@latest/index.min"
        },
        shim: {
            "path": {
                exports: "posix"
            }
        },
    });
    requirejs(['stage', "components/lessonPlay", ], (
        Stage, lessonPlay,
    ) => {
        document.title = "魔女兵器";
        const container = document.createElement('div');
        container.id = "stage";

        const _options = { width: 1024, height: 576, lesson: document.location.search.match(/lesson=(\d+)/)[1], };

        const stage = new Stage({ width: _options.width, height: _options.height, use_buffer: true, auto_fullwindow: true, auto_refresh: true, })
            .init().mount(container);
        
        const player = new lessonPlay(stage, () => document.querySelector("#app").replaceChildren(container))
            .init(_options.lesson).then(player => player.start());

        /*
        const bg = stage.layer('bg').size(1024, 576).location(0, 0).toDisplay(true);
        const role = stage.layer('role').size(510, 722).location(100, 0).toDisplay(true);

        const resource = new Resource();
        resource.load([
            { id: "bg/BG_City_coffeeShop", url: "/resources/background/BG_City_coffeeShop.png" },
            { id: "role/13", url: "/resources/role/role13.png" },
        ]);

        const _img = (blob, dest, scale = 1) => {
            const img = new Image;
            img.onload = () => dest.drawImage(img, 0, 0, img.width * scale, img.height * scale);
            img.src = URL.createObjectURL(blob);
        };*/

        /*
        const _test = async () => {
            for await (const t of resource.wait(["bg/BG_City_coffeeShop"])) {
                console.log(t);
                bg.renderBlob(resource.blob("bg/BG_City_coffeeShop"), 0, 0)
            }
            for await (const t of resource.wait(["role/13"])) {
                console.log(t);
                //_img(resource.blob("role/13"), role, 0.75);
                role.renderBlob(resource.blob("role/13"), 0, 0, 570*0.75, 722*0.75)
            }
        };

        _test().then(() => {
            stage.update();
            _load(container);
        });

        stage.canvas.addEventListener('click', event => {
            console.log(event)
        }) //*/

        /*test:
        const _tr = new ClassifiedResInterpreter().init(_options.lesson).then(async instance => {
            instance.load();
            while(true){
                for await (const t of instance.next()){
                    console.log(t);
                    if(t[0] === _CONST_ClassifiedResInterpreter.STATUS_NEXT_END) return;
                }
                    
                
            }
        })//*/
    });
})();
