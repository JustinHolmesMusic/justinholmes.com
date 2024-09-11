import {fileURLToPath} from "url";
import path from "path";
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
export const srcDir = path.resolve(__filename, '../..');
export const projectRootDir = path.resolve(srcDir, '..');

// Templates directories
export const templateDir = path.resolve(srcDir, 'templates');
export const pageBaseDir = path.resolve(templateDir, 'pages');

// Data directories.
export const dataDir = path.resolve(srcDir, 'data');
export const showsDir = path.resolve(dataDir, 'shows');
export const imagesSourceDir = path.join(srcDir, 'images');

// Output directories
export const outputPrebuildBaseDir = path.resolve(projectRootDir, '_prebuild_output');
export const outputDistBaseDir = path.resolve(projectRootDir, 'justinholmes.com.public.dist');
