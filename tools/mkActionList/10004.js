const lessonFile = "./lesson10004.txt";
const sentenceBase = "../../Story-Pages/resources/lesson/sentence";

const make = require('./make');
const YAML = require('yaml');
const fs = require('node:fs/promises');

(async () => {
    const content = await fs.readFile(lessonFile, { encoding: 'utf8' });
    const result = await make(content, sentenceBase, true);
    console.log(result);
    await fs.writeFile("./lesson.10004.yaml", YAML.stringify(result));
})();
