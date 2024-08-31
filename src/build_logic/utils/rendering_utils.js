import path from "path";
import {outputBaseDir, templateDir} from "../constants.js";
import fs from "fs";
import nunjucks from "nunjucks";


export function renderPage({template_path, context, output_path, layout = "base.hbs"}) {
    const outputFilePath = path.join(outputBaseDir, output_path);

    if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(path.dirname(outputFilePath), {recursive: true});
    }
    const template = path.join(templateDir, template_path);
    let rendered_page = nunjucks.render(template, context, function (err, rendered_page) {
        if (err) {
            console.error('Error rendering template:', err);
            throw err;
        } else {
            fs.writeFileSync(outputFilePath, rendered_page);
            return rendered_page;
        }
    });
    return rendered_page;
}