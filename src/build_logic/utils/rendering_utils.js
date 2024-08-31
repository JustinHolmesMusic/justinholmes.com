import path from "path";
import {outputBaseDir, templateDir} from "../constants.js";
import fs from "fs";
import nunjucks from "nunjucks";


export function renderPage({template_path, context, output_path, layout = "base.hbs"}) {
    const outputFilePath = path.join(outputBaseDir, output_path);

    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, {recursive: true});
    }
    const template = path.join(templateDir, template_path);
    // const templateSource = fs.readFileSync(hbsTemplate, 'utf8');
    // const template = Handlebars.compile(templateSource);
    // const mainBlockContent = template(context);
    // const baseTemplate = Handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts', layout), 'utf8'));

    // let rendered_page = baseTemplate({...context, main_block: mainBlockContent});

    let rendered_page = nunjucks.render(template, context);
    return rendered_page
}