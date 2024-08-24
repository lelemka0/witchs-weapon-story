const lessonDir = "../../Story-Pages/resources/lesson";
const sentenceDir = "../../Story-Pages/resources/lesson/sentence";

const make = require('./make');
const YAML = require('yaml');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
    await fs.readdir(lessonDir, { recursive: false })
        .then(async files => {
            for (const filename of files) {
                let file;
                if (file = filename.match(/^lesson(\d+)\.asset$/)) {
                    /* test use
                    if(file[1] !== '10001')continue;
                    //*/
                    if(file[1] === "10004"){
                        console.error("json格式错误 10004 先跳过");
                        continue;
                    }
                    console.log("parsing " + file[1]);
                    const result = await make(path.join(lessonDir, filename), sentenceDir);
                    await fs.writeFile(path.join("./outputs", `lesson.${file[1]}.yaml`), YAML.stringify(result));
                }
            }
        });
})();
