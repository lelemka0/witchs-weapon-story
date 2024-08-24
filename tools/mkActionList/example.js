const lessonFile = "../../Exported/latest_mixed/ExportedProject/Assets/resources-/guide/lesson/lesson10103.asset";
const sentenceBase = "../../Exported/latest_mixed/ExportedProject/Assets/_temp_config/config/lesson/";

const make = require('./make');
const YAML = require('yaml');
const fs = require('node:fs/promises');

(async () => {
    const result = await make(lessonFile, sentenceBase);
    console.log(result);
    await fs.writeFile("./test.output.all.yaml", YAML.stringify(result));
})();
