import * as path from 'path';
import { each } from 'realm-utils'
import { FuseBox } from 'fuse-box';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as appRoot from 'app-root-path';

export type EnvResult = {
    fusebox: FuseBox,
    project: any,
    projectContents: any,
};

export function createEnv(opts: any): Promise<EnvResult> {
    const name = opts.name || `hih-test-${new Date().getTime()}`;
    let tmpFolder = path.join(appRoot.path, '.fusebox', 'tests');
    mkdirp(tmpFolder)
    let localPath = path.join(tmpFolder, name);
    const output: any = {
        modules: {}
    }
    const modulesFolder = path.join(localPath, 'modules');
    let fusebox;
    // creating modules
    return each(opts.modules, (moduleParams, name) => {
        return new Promise((resolve, reject) => {
            moduleParams.outFile = path.join(modulesFolder, name, "index.js");
            moduleParams.package = name;
            moduleParams.cache = false;
            moduleParams.log = false;
            moduleParams.tsConfig = path.join(appRoot.path, "test", "fixtures", "tsconfig.json")
            FuseBox.init(moduleParams).bundle(moduleParams.instructions, () => {
                if (moduleParams.onDone) {
                    moduleParams.onDone({
                        localPath: localPath,
                        filePath: moduleParams.outFile,
                        projectDir: path.join(localPath, "project")
                    });
                }
                output.modules[name] = require(moduleParams.outFile);
                return resolve();
            })
        });
    }).then(() => {
        const projectOptions = opts.project;
        projectOptions.outFile = path.join(localPath, 'project', 'index.js');
        if (projectOptions.cache === undefined) {
            projectOptions.cache = false;
        }
        projectOptions.log = false;
        projectOptions.tsConfig = path.join(appRoot.path, 'tsconfig.json')
        projectOptions.modulesFolder = modulesFolder;
        return new Promise((resolve, reject) => {
            fusebox = FuseBox.init(projectOptions);
            fusebox.bundle(projectOptions.instructions, () => {
                const contents = fs.readFileSync(projectOptions.outFile);
                const length = contents.buffer.byteLength;
                output.project = require(projectOptions.outFile);
                output.projectSize = length;
                output.projectContents = contents;
                output.fusebox = fusebox;
                return resolve();
            });
        });
    }).then(() => {
        //deleteFolderRecursive(localPath);
        return output;
    });
}
