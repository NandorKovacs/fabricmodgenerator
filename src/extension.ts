// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from 'fs/promises';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function inputBox(name: string, value: string, exec: (res: string) => void) {
  vscode.window.showInputBox({
    title: name,
    value: value,
    valueSelection: undefined,
    prompt: name,
    placeHolder: name,
    password: false,
    ignoreFocusOut: true
  }).then((str) => {
    if (str !== undefined) {
      exec(str);
    } else {
      console.log("cancelled " + name);
    }
  }, () => {
    console.log("failed to get " + name);
  });
}

function projectName() {
  inputBox("Project Folder Name", "Example Mod", (res) => { chooseFolder(res); });
}

function chooseFolder(folderName: string) {
  vscode.window.showOpenDialog({
    defaultUri: vscode.Uri.file(vscode.workspace.asRelativePath(vscode.Uri.parse("/"), true)),
    openLabel: "open",
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    filters: {},
    title: ""
  }).then((uri) => {
    let basePath;
    if (uri !== undefined && uri?.length > 0) {
      basePath = uri[0];
    } else {
      console.log("didnt select base folder");
      return;
    }

    let pathAsStr = vscode.workspace.asRelativePath(basePath, true);
    let nameOfProject = "\\" + folderName;

    createAndClone(pathAsStr + nameOfProject, folderName);
  }, () => {
    console.log("select folder failed");
  });
}

function createAndClone(pathStr: string, folderName: string) {
  fs.mkdir(pathStr, { recursive: true }).then((pPathAsOr) => {
    if (pPathAsOr !== undefined) {
      let clone = require("git-clone/promise");
      console.log(pPathAsOr);
      clone("https://github.com/FabricMC/fabric-example-mod", vscode.workspace.asRelativePath(pPathAsOr, true), []);

      mainPackage(pathStr, folderName);
    } else {
      console.log("mkdir project folder failed");
    }
  }, () => {
    console.log("mkdir failed");
  });
}

function removeAllGit(pathStr: string) {
  fs.rm(pathStr + "\\.github", { recursive: true }).then(
    () => {
      fs.rm(pathStr + "\\.git", { recursive: true }).then(
        () => {
          return;
        }, () => {
          console.log("rm .git failed");
        });
    }, () => {
      console.log("rm .github failed");
    }
  );
}

function packageToPath(mainPackageStr: string) {
  let splitted = mainPackageStr.split(".");

  let res: string = "";

  for (let s of splitted) {
    res = res + "\\" + s;
  }

  return res;
}

function mainPackage(pathStr: string, folderName: string) {
  inputBox("Main Package", "net.example.example_mod", (mainPackageStr) => {
    modid(pathStr, mainPackageStr, folderName);
  });
}

function getModIdFromPackage(mainPackageStr: string){
  let splitted = mainPackageStr.split(".");

  return splitted[splitted.length - 1];
}

function modid(pathStr: string, mainPackageStr: string, folderName: string) {
  inputBox("Mod Id", getModIdFromPackage(mainPackageStr), (modidStr) => {
    initClass(pathStr, mainPackageStr, modidStr, folderName);
  });
}

function initClass(pathStr: string, mainPackageStr: string, modidStr: string, folderName: string) {
  inputBox("Initializer Class Name", folderName.replace(" ", ""), (initClassStr) => {

    modifySrc(pathStr, mainPackageStr, modidStr, initClassStr);

    modName(pathStr, mainPackageStr, modidStr, initClassStr, folderName);
  });
}

function modifySrc(pathStr: string, mainPackageStr: string, modidStr: string, initClassStr: string) {
  fs.readFile(
    pathStr + "\\src\\main\\java" + packageToPath("net.fabricmc.example") + "\\ExampleMod.java",
    { encoding: "ascii" }).then(
      (javaMain) => {
        javaMain = javaMain.replace("net.fabricmc.example", mainPackageStr);
        javaMain = javaMain.replace("modid", modidStr);
        javaMain = javaMain.replace("ExampleMod", initClassStr);

        fs.rm(pathStr + "\\src\\main\\java\\net", { recursive: true }).then(
          () => {
            fs.mkdir(pathStr + "\\src\\main\\java" + packageToPath(mainPackageStr), { recursive: true }).then(
              (str) => {
                fs.writeFile(
                  pathStr + "\\src\\main\\java" + packageToPath(mainPackageStr) + "\\" + initClassStr + ".java", javaMain).then(
                    () => {
                      removeAllGit(pathStr);
                    }, () => {
                      console.log("write java main failed");
                    }
                  );
              }, () => {
                console.log("mkdir main package failed");
              }
            );
          }, () => {
            console.log("rm net failed");
          }
        );
      }, () => {
        console.log("java main read failed");
      }
    );
}

function modName(pathStr: string, mainPackageStr: string, modidStr: string, initClassStr: string, folderName: string) {
  inputBox("Mod Name", folderName, (modNameStr) => {
    description(pathStr, mainPackageStr, modidStr, initClassStr, modNameStr);
  });
}

function description(pathStr: string, mainPackageStr: string, modidStr: string, initClassStr: string, modNameStr: string) {
  inputBox("Mod Description", "this is a description", (descriptionStr) => {
    author(pathStr, mainPackageStr, modidStr, initClassStr, modNameStr, descriptionStr);
  });
}

function author(pathStr: string, mainPackageStr: string, modidStr: string, initClassStr: string, modNameStr: string, descriptionStr: string) {
  inputBox("Author", "Me", (authorStr) => {
    configureModJson(pathStr, mainPackageStr, modidStr, initClassStr, modNameStr, descriptionStr, authorStr);
    configureMixinJson(pathStr, mainPackageStr, modidStr);
    mavenGroup(pathStr, mainPackageStr, modidStr);
  });
}

function mavenGroup(pathStr: string, mainPackageStr: string, modidStr: string) {
  inputBox("Maven Group", mainPackageStr, (mavenGroupStr) => {
    archivesBaseName(pathStr, mavenGroupStr, modidStr);
  });
}

function archivesBaseName(pathStr: string, mavenGroupStr: string, modidStr: string) {
  inputBox("Archives Base Name", modidStr, (archivesBaseNameStr) => {
    configureProperties(pathStr, mavenGroupStr, archivesBaseNameStr);
  });
}

function configureModJson(pathStr: string, mainPackageStr: string, modidStr: string, initClassStr: string, modNameStr: string, descriptionStr: string, authorStr: string) {
  fs.readFile(pathStr + "\\src\\main\\resources\\fabric.mod.json", {encoding: "ascii"}).then(
    (json) => {
      let objJson = JSON.parse(json);

      objJson.id = modidStr;
      objJson.name = modNameStr;
      objJson.description = descriptionStr;
      objJson.authors = [authorStr];
      objJson.contact = {};
      objJson.entrypoints.main = [mainPackageStr + "." + initClassStr];
      objJson.mixins = [modidStr + ".mixins.json"];
      objJson.suggests = {};

      let strJson = JSON.stringify(objJson);

      fs.rm(pathStr + "\\src\\main\\resources\\fabric.mod.json").then(
        () => {
          fs.writeFile(pathStr + "\\src\\main\\resources\\fabric.mod.json", strJson, {encoding: "ascii"}).then(
            () => {
              return;
            }, () => {
              console.log("write fabric.mod.json failed");
            }
          );
        }, () => {
          console.log("rm fabric.mod.json failed");
        }
      );

    }, () => {
      console.log("failed to read fabric.mod.json");
    }
  );
}

function configureMixinJson(pathStr: string, mainPackageStr: string, modidStr: string) {
  fs.readFile(pathStr + "\\src\\main\\resources\\modid.mixins.json", {encoding: "ascii"}).then(
    (json) => {
      let objJson = JSON.parse(json);

      objJson.package = mainPackageStr + ".mixin";
      objJson.client = [];

      let strJson = JSON.stringify(objJson);

      fs.rm(pathStr + "\\src\\main\\resources\\modid.mixins.json").then(
        () => {
          fs.writeFile(pathStr + "\\src\\main\\resources\\" + modidStr + ".mod.json", strJson, {encoding: "ascii"}).then(
            () => {
              return;
            }, () => {
              console.log("write " + modidStr + ".mixins.json failed");
            }
          );
        }, () => {
          console.log("rm modid.mixins.json failed");
        }
      );

    }, () => {
      console.log("failed to read modid.mixins.json");
    }
  );
}

function configureProperties(pathStr: string, mavenGroupStr: string, archivesBaseNameStr: string) {
  fs.readFile(pathStr + "\\gradle.properties", {encoding: "ascii"}).then(
    (properties) => {
      properties = properties.replace("com.example", mavenGroupStr);
      properties = properties.replace("fabric-example-mod", archivesBaseNameStr);

      fs.rm(pathStr + "\\gradle.properties").then(
        () => {
          fs.writeFile(pathStr + "\\gradle.properties", properties, {encoding: "ascii"}).then(
            () => {
              return;
            }, () => {
              console.log("write properties failed");
            }
          );
        }, () => {
          console.log("rm properties failed");
        }
      );
    }, () => {
      console.log("read properties failed");
    }
  );
}

export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "fabricmodgenerator" is now active!');

  let generateMod = vscode.commands.registerCommand('fabricmodgenerator.generate', () => {
    vscode.window.showInformationMessage('Generating ...');

    projectName();
  });

  context.subscriptions.push(generateMod);
}

// this method is called when your extension is deactivated
export function deactivate() { }
