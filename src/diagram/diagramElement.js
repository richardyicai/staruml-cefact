const MainJSONDiagram = require('./mainjsonDiagram');
const fs = require('fs');
const InfoDiagram = require('./infoDiagram');
const ComponentDiagram = require('./componentDiagram');
const Utils = require('../utils');
const utils = new Utils();
const FileGenerator = require('../filegenerator');
const PathsDiagram = require('./pathsDiagram');
const Servers = require('../servers');
const constant = require('../constant');
const SwaggerParser = require("swagger-parser");
let parser = new SwaggerParser();
var forEach = require('async-foreach').forEach;
const openAPI = require('../openapi');


let UMLClass = null;
let UMLInterface = null;
let UMLAssociation = null;
let UMLGeneralization = null;
let UMLInterfaceRealization = null;
let UMLEnumeration = null;
let UMLAssociationClassLink = null;
let AllElement = null;

function setUMLDiagramElement(mAllElement) {
    mAllElement.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    AllElement = mAllElement;
}

function getUMLDiagramElement() {
    return AllElement;
}

function setUMLClass(mUMLClass) {
    console.log("UMLClasses", mUMLClass);
    UMLClass = mUMLClass
}

function getUMLClass() {
    return UMLClass;
}

function setUMLInterface(mUMLInterface) {
    mUMLInterface.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLInterface", mUMLInterface);
    UMLInterface = mUMLInterface;
}

function getUMLInterface() {
    return UMLInterface;
}

function setUMLAssociation(mUMLAssociation) {
    mUMLAssociation.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLAssociation", mUMLAssociation);
    UMLAssociation = mUMLAssociation;
}

function getUMLAssociation() {
    return UMLAssociation;
}

function setUMLGeneralization(mUMLGeneralization) {
    mUMLGeneralization.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLGeneralization", mUMLGeneralization);
    UMLGeneralization = mUMLGeneralization;
}

function getUMLGeneralization() {
    return UMLGeneralization;
}

function setUMLInterfaceRealization(mUMLInterfaceRealization) {
    mUMLInterfaceRealization.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLInterfaceRealization", mUMLInterfaceRealization);
    UMLInterfaceRealization = mUMLInterfaceRealization;
}

function getUMLInterfaceRealization() {
    return UMLInterfaceRealization;
}

function setUMLEnumeration(mUMLEnumeration) {
    mUMLEnumeration.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLEnumeration", mUMLEnumeration);
    UMLEnumeration = mUMLEnumeration;
}

function getUMLEnumeration() {
    return UMLEnumeration
}

function setUMLAssociationClassLink(mUMLAssociationClassLink) {
    mUMLAssociationClassLink.sort(function (a, b) {
        return a.name.localeCompare(b.name);
    });
    console.log("UMLAssociationClassLink", mUMLAssociationClassLink);
    UMLAssociationClassLink = mUMLAssociationClassLink;
}

function getUMLAssociationClassLink() {
    return UMLAssociationClassLink;
}
let UMLPackage = null;
let Basepath = null;
let Options = null;
let Filetype = null;

function setUMLPackage(mUMLPackage) {
    UMLPackage = mUMLPackage;
}

function getUMLPackage() {
    return UMLPackage;
}

function setBasePath(mBasepath) {
    Basepath = mBasepath;
}

function getBasePath() {
    return Basepath;
}

function setOptions(mOptions) {
    Options = mOptions;
}

function getOptions() {
    return Options;
}

function setFileType(mFileType) {
    Filetype = mFileType;
}

function getFileType() {
    return Filetype;
}
async function getUMLModel(mOpenApi) {

    try {
        openAPI.OpenAPI = mOpenApi;
        let dm = app.dialogs;
        let vDialog = dm.showModalDialog("", constant.titleopenapi, "Please wait untill OpenAPI spec generation is being processed for the \'" + getUMLPackage().name + "\' Diagram", [], true);
        let result = await initUMLPackage();
        console.log("initialize", result);
        let resultElement = await getModelElements();
        console.log("resultElement", resultElement);
        let resultGen = await generateOpenAPI();
        console.log("resultGen", resultGen);
        if (resultGen.result == constant.FIELD_SUCCESS) {
            vDialog.close();
            setTimeout(function () {
                let dType = '';
                if (openAPI.getModelType() == openAPI.APP_MODEL_DIAGRAM) {
                    dType = "Diagram";
                } else if (openAPI.getModelType() == openAPI.APP_MODEL_PACKAGE) {
                    dType = "Package";
                }
                app.dialogs.showInfoDialog(dType + " : " + resultGen.message);

            }, 10);
            vDialog = null;
        }


    } catch (err) {
        //vDialog.close();
        setTimeout(function () {
            app.dialogs.showErrorDialog(err.message);
            console.error("Error getUMLModel", err);
        }, 10);
    }
}

function generateOpenAPI() {
    return new Promise((resolve, reject) => {
        try {

            // let _this = this;
            /* TODO */
            openAPI.OpenAPI.resetPackagePath();
            let srcRes = app.repository.search(getUMLPackage().name);
            let fRes = srcRes.filter(function (item) {
                return (item instanceof type.UMLClassDiagram && item.name == getUMLPackage().name);
            });
            let arrPath = null;
            let rPath = null;

            if (fRes.length == 1) {

                /* TODO  let */
                arrPath = openAPI.findHierarchy(fRes[0]._parent);
                /* TODO  let */
                rPath = openAPI.reversePkgPath(arrPath);
                /* TODO */
                openAPI.OpenApi.setPackagepath(rPath);
            }


            /*  Add openapi version */
            MainJSONDiagram.addApiVersion('3.0.0');
            console.log("-----version-generated");

            /* Add openapi information */
            let mInfo = new InfoDiagram();
            MainJSONDiagram.addInfo(mInfo);
            console.log("-----info-generated");

            /* Add openapi servers */
            let server = new Servers();
            MainJSONDiagram.addServers(server);
            console.log("-----server-generated");

            /* Add openapi paths */
            let pathsDiagram = new PathsDiagram();
            MainJSONDiagram.addPaths(pathsDiagram);
            console.log("-----path-generated");

            /* Add openapi component */
            let componentDiagram = new ComponentDiagram();
            MainJSONDiagram.addComponent(componentDiagram);
            console.log("-----component-generated-----");
            console.log(MainJSONDiagram.getJSON());
            let generator = new FileGenerator();
            generator.generate().then(function (fileGenerate) {
                console.log("-----file-generated-----");
                console.log("result-file-generated", fileGenerate);
                generator.validateAndPrompt().then(function (result) {
                    console.log("-----validate & prompt-----");
                    console.log("result-validate & prompt", result);
                    resolve(result);
                }).catch(function (err) {
                    reject(err);
                });

            }).catch(function (err) {
                reject(err);
            });

        } catch (error) {

            console.error("generateOpenAPI", error);
            utils.writeErrorToFile(error);
            reject(error);
        }
    });
}

function getModelElements() {

    return new Promise((resolve, reject) => {
        let uniqueClassesArr = [];

        /* ------------ 1. UMLClass ------------ */
        let umlClasses = getUMLClass();

        /* ------------ 2. UMLInterface ------------ */
        let operations = getUMLInterface();

        /* ------------ 3. Association Class------------ */
        try {
            let tmpAsso = [];
            forEach(getUMLAssociation(), (child, index) => {
                if (child.end1.reference.name != child.end2.reference.name) {

                    let filter = umlClasses.filter(subItem => {
                        return child.end2.reference.name == subItem.name;
                    });

                    if (filter.length == 0) {
                        umlClasses.push(child.end2.reference);
                        tmpAsso.push(child.end2.reference);
                    }
                }

            });
            console.log("UMLAssociation", tmpAsso);

            /* ------------ 4. Generalization Class ------------ */

            let tmpGen = [];
            forEach(getUMLGeneralization(), (child, index) => {
                let filter = umlClasses.filter(subItem => {
                    return child.target.name == subItem.name;
                });
                if (filter.length == 0) {
                    umlClasses.push(child.target);
                    tmpGen.push(child.target.name);
                }
            });
            console.log("UMLGeneralization", tmpGen);

            /* ------------ 5. Filter unique classes ------------ */
            let resArr = [];
            forEach(umlClasses, (item, index) => {
                let filter = resArr.filter(subItem => {
                    return subItem._id == item._id;
                });
                if (filter.length == 0) {
                    resArr.push(item);
                }

            });
            console.log("Filter class done");

            /* ------------ 6. Sort unique classes ------------ */
            resArr.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });
            console.log("Sort class done");

            let uniqueArr = [];
            let duplicateClasses = [];
            let isDuplicate = false;


            forEach(resArr, function (item, index) {
                let filter = uniqueArr.filter(subItem => {
                    return item.name == subItem.name;
                });

                if (filter.length == 0) {
                    uniqueArr.push(item);
                } else {
                    isDuplicate = true;
                    duplicateClasses.push(item.name);
                    let firstElem = uniqueArr.indexOf(filter[0]);
                    uniqueArr[firstElem].attributes = uniqueArr[firstElem].attributes.concat(item.attributes);
                    uniqueArr[firstElem].ownedElements = uniqueArr[firstElem].ownedElements.concat(item.ownedElements);
                }
                uniqueClassesArr = uniqueArr;

            });


            if (!isDuplicate) {

                let mClasses = [];
                forEach(uniqueClassesArr, element => {
                    mClasses.push(element.name);
                });

                let mPaths = [];
                forEach(operations, element => {
                    mPaths.push(element.name);
                });
                console.log("Duplication filter done");
                console.log("Query Total Classes", mClasses);
                console.log("Query Total Interfaces", mPaths);
                resolve({
                    result: constant.FIELD_SUCCESS,
                    message: "model element generated"
                });
            } else {
                let message = null;
                if (duplicateClasses.length > 1) {
                    message = "There are duplicate \'" + duplicateClasses.join("\', \'") + "\'" + " classes for same name.";
                } else {
                    message = "There is duplicate \'" + duplicateClasses.join("\', \'") + "\'" + " class for same name.";
                }

                if (openAPI.getAppMode() == openAPI.APP_MODE_TEST && openAPI.getTestMode() == openAPI.TEST_MODE_ALL) {
                    let jsonError = {
                        isDuplicate: true,
                        msg: message
                    };
                    openAPI.setError(jsonError);
                }

                reject(new Error(message));

            }
        } catch (err) {
            reject(err)
        };
    });


}
/**
 * @function initUMLPackage
 * @description initializes UML Package
 */
function initUMLPackage() {
    return new Promise((resolve, reject) => {
        try {
            try {
                if (!fs.existsSync(getBasePath())) {
                    fs.mkdirSync(getBasePath());
                    resolve({
                        result: "success",
                        message: "Package initialize successfully"
                    })
                } else {
                    resolve({
                        result: "success",
                        message: "Package initialize successfully"
                    })
                }
            } catch (err) {
                console.error(err)
                reject(err);
            }

        } catch (_e) {
            console.error(_e);
            reject(_e);
            app.toast.error(constant.strerrorgenfail);
        }
    });

}
module.exports.setUMLClass = setUMLClass;
module.exports.getUMLClass = getUMLClass;
module.exports.setUMLInterface = setUMLInterface;
module.exports.getUMLInterface = getUMLInterface;
module.exports.setUMLAssociation = setUMLAssociation;
module.exports.getUMLAssociation = getUMLAssociation;
module.exports.setUMLGeneralization = setUMLGeneralization;
module.exports.getUMLGeneralization = getUMLGeneralization;
module.exports.setUMLInterfaceRealization = setUMLInterfaceRealization;
module.exports.getUMLInterfaceRealization = getUMLInterfaceRealization;
module.exports.setUMLEnumeration = setUMLEnumeration;
module.exports.getUMLEnumeration = getUMLEnumeration;
module.exports.setUMLAssociationClassLink = setUMLAssociationClassLink;
module.exports.getUMLAssociationClassLink = getUMLAssociationClassLink;
module.exports.setUMLDiagramElement = setUMLDiagramElement;
module.exports.getUMLDiagramElement = getUMLDiagramElement;
module.exports.setUMLPackage = setUMLPackage;
module.exports.getUMLPackage = getUMLPackage;
module.exports.setBasePath = setBasePath;
module.exports.getBasePath = getBasePath;
module.exports.setOptions = setOptions;
module.exports.getOptions = getOptions;
module.exports.setFileType = setFileType;
module.exports.getFileType = getFileType;
module.exports.getUMLModel = getUMLModel;