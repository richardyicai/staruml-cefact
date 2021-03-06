var forEach = require('async-foreach').forEach;
const notAvailElement = require('./notavailelement');
const openAPI = require('./openapi');
const fs = require('fs');
const constant = require('./constant');
const dElement = require('../src/diagram/dElement');



/**
 * @description class is general utility class for the whole project
 * @class Utils
 */

let errorContent = [];
let mFileName = '/error.txt';
/**
 * @constructor Creates an instance of Utils.
 */
function resetErrorBlock() {
     errorContent = [];
     mFileName = '/error.txt';
}

/**
 * @function writeErrorToFile
 * @description Catch the error and write it to file
 * @param {Object} error
 * @memberof Utils
 */
function writeErrorToFile(error) {
     errorContent.push(error.message);
     fs.writeFile(openAPI.getFilePath() + mFileName, JSON.stringify(errorContent), function (err) {
          if (err) {
               console.error("Error writing file", err);
          }
     });
}

/**
 * @function buildDescription
 * @description Description replace (') with ('')
 * @param {string} desc
 * @memberof Utils
 */
function buildDescription(desc) {
     if (desc)
          return desc.replace(/\'/g, "''")

     return null;
}

/**
 * @function buildParameter
 * @description Adds parameters to the file
 * @param {string} name
 * @param {string} type
 * @param {string} description
 * @param {boolean} required
 * @param {string} schema 
 * @memberof Utils
 */
function buildParameter(name, type, description, required, schema, paramsObject) {

     if (paramsObject == null) {
          return;
     }

     paramsObject.name = name;
     paramsObject.in = type;
     paramsObject.description = description;
     paramsObject.required = required;
     paramsObject.schema = schema;

}




/**
 * @function buildRequestBody
 * @description Adds request body to requestBodyObj
 * @param {UMLInterfaceRealization} objInterface
 * @param {Object} requestBodyObj
 * @memberof Utils
 */
function buildRequestBody(objInterface, requestBodyObj) {

     let contentObj = {};
     requestBodyObj.content = contentObj;

     let appJsonObject = {};
     contentObj['application/json'] = appJsonObject;

     let schemaObj = {};
     appJsonObject.schema = schemaObj;

     schemaObj['$ref'] = constant.getReference() + objInterface.source.name;


     requestBodyObj.description = '';
     requestBodyObj.required = true;

}

/**
 * @function writeQueryParameters
 * @description adds query paramerter in object
 * @param {Array} parametersArray
 * @param {Object} objOperation
 * @memberof Utils
 */
function writeQueryParameters(parametersArray, objOperation) {
     try {
          objOperation.parameters.forEach(itemParameters => {
               let paramsObject = {};
               if (itemParameters.name != "id" && itemParameters.name != "identifier") {
                    parametersArray.push(paramsObject);
                    let objSchema = {};
                    objSchema.type = 'string';
                    if (!(itemParameters.type instanceof type.UMLClass)) {
                         buildParameter(itemParameters.name, "query", (itemParameters.documentation ?
                              buildDescription(itemParameters.documentation) :
                              constant.STR_MISSING_DESCRIPTION), false, objSchema, paramsObject);
                    } else {

                         buildParameter(itemParameters.type.name + "." + itemParameters.name, "query", (itemParameters.documentation ?
                              buildDescription(itemParameters.documentation) :
                              constant.STR_MISSING_DESCRIPTION), false, objSchema, paramsObject);

                    }
               }
          });
     } catch (error) {
          console.error("Found error", error.message);
          writeErrorToFile(error);
     }
}

/**
 * @function getEnumerationLiteral
 * @description return Enumeratoin literals
 * @param {UMLEnumaration} objEnum 
 * @returns {Array}
 * @memberof Utils
 */
function getEnumerationLiteral(objEnum) {
     if (objEnum) {
          let result = [];
          let literals = [];
          if (openAPI.isModelPackage()) {
               forEach(objEnum.literals, function (literal) {
                    result.push(literal.name);
               });
          } else if (openAPI.isModelDiagram()) {
               let enumView = getViewFromCurrentDiagram(objEnum);
               if (enumView) {

                    let literalViews = getVisibleLiteralsView(enumView);
                    forEach(literalViews, function (literalView) {
                         literals.push(literalView.model);
                    });
                    forEach(literals, function (literal) {
                         /* Filter for visible literal Views from diagram elements (Enumeration) */
                         result.push(literal.name);
                    });
               }

          }
          return result;
     }
}

/**
 * @function isEmpty
 * @description check UMLPackage has UMLClass, UMLInterface, UMLEnumeration and return boolean
 * @param {*} umlPackage
 * @returns {boolean}
 */
function isEmpty(exportElement) {
     let ownedElements = [];
     if (exportElement instanceof type.UMLClassDiagram) {
          exportElement.ownedViews.filter(function (item) {
               if (item instanceof type.UMLClassView ||
                    item instanceof type.UMLInterfaceView ||
                    item instanceof type.UMLEnumerationView) {
                    ownedElements.push(item);
               }
          });
     } else if (exportElement instanceof type.UMLPackage) {
          exportElement.ownedElements.filter(function (item) {
               if (item instanceof type.UMLClass ||
                    item instanceof type.UMLInterface ||
                    item instanceof type.UMLEnumeration) {
                    ownedElements.push(item);
               }
          });
     }

     if (ownedElements.length > 0) {
          return false;
     }
     return true;
}

/**
 * @function isString
 * @description returns boolean that checks values is string or any object
 * @returns {boolean}
 */
function isString(s) {
     return typeof (s) === 'string' || s instanceof String;
}

/**
 * @function addAttributeType
 * @description add attribute type based on openapi spefication datatype
 * @param {Object} itemsObj 
 * @memberof Utils
 */
function addAttributeType(itemsObj, attr) {
     let attributeType = attr.type;

     if (isCoreDataType(attributeType)) {

          /* Added reference in allOf object when attribute type is among the Core Data Type */
          let coreType = getCoreDataType(attributeType);
          let coreAttribs = coreType.attributes;
          if (coreAttribs.length > 0) {
               addReferenceTypeRule(itemsObj, coreType);
          } else {
               addJsonRuleType(attr, coreType.name, itemsObj);
          }

     } else {
          addJsonRuleType(attr, attributeType, itemsObj);
     }
}

function addReferenceTypeRule(itemsObj, coreType) {
     let allOfArray = [];
     itemsObj.allOf = allOfArray;

     /* Adding description */
     let allOfObject = {};
     allOfObject['description'] = itemsObj.description;
     allOfArray.push(allOfObject);

     /* Delete description from parent object */
     delete itemsObj['description']

     /* Adding reference */
     allOfObject = {};
     allOfObject['$ref'] = constant.getReference() + coreType.name;
     allOfArray.push(allOfObject);

     /* Adding object field */
     allOfObject = {};
     allOfObject.type = 'object';
     allOfArray.push(allOfObject);
}
let mJsonRuleType = [];

function initJsonRuleType() {
     mJsonRuleType = [{
          key: 'Text',
          type: 'string'
     }, {
          key: 'Numeric',
          type: 'number'

     }, {
          key: 'Indicator',
          type: 'boolean'
     }, {
          key: 'Date',
          type: 'string',
          format: 'date'
     }, {
          key: 'DateTime',
          type: 'string',
          format: 'date-time'
     }, {
          key: 'Integer',
          type: 'integer'
     }, {
          key: 'Int32',
          type: 'integer',
          format: 'int32',
     }, {
          key: 'Int64',
          type: 'integer',
          format: 'int64',
     }, {
          key: 'Number',
          type: 'number'
     }, {
          key: 'Float',
          type: 'number',
          format: 'float'
     }, {
          key: 'Double',
          type: 'number',
          format: 'double'
     }, {
          key: 'Password',
          type: 'string',
          format: 'password'
     }, {
          key: 'Byte',
          type: 'string',
          format: 'byte'
     }, {
          key: 'Boolean',
          type: 'boolean'
     }, {
          key: 'Binary',
          type: 'string',
          format: 'binary'
     }, {
          key: 'Quantity',
          type: 'integer'
     }];
     console.log("JsonRuleType initialized", mJsonRuleType);
}

function getJsonRuleType() {
     return mJsonRuleType;
}

function addJsonRuleType(attr, attributeType, itemsObj) {

     let result = getJsonRuleType().filter(function (rule) {
          return rule.key == attributeType;
     });
     if (result.length > 0) {
          let rule = result[0];
          itemsObj.type = rule.type;
          if (rule.hasOwnProperty('format')) {
               itemsObj.format = rule.format;
          }

     } else if (result.length == 0) {
          itemsObj.type = 'string';
          if (isString(attributeType)) {
               notAvailElement.addNotAvailableAttribute(attr._parent.name, attr, attributeType);
          } else if (attributeType instanceof type.UMLClass) {
               notAvailElement.addNotAvailableAttribute(attr._parent.name, attr, attributeType.name);
          }
     }
}
/**
 * @function isCoreDataType
 * @description check attrType is coretype or not. If it is core data type and has attributes then returns true else false
 * @param {Object} attrType 
 * @returns {boolean}
 * @memberof Utils
 */
function isCoreDataType(attrType) {

     if (attrType instanceof type.UMLClass) {
          let coreTypes = getCoreTypes();
          let typeResult = coreTypes.filter(function (types) {
               return attrType._id == types._id
          });
          if (typeResult.length > 0) {
               return true;
          }
     }

     return false;
}

/**
 * @function getCoreDataType
 * @description return core type
 * @param {Object} attrType 
 * @returns {Object}
 * @memberof Utils
 */
function getCoreDataType(attrType) {
     if (attrType instanceof type.UMLClass) {
          let coreTypes = getCoreTypes();
          let typeResult = coreTypes.filter(function (types) {
               return attrType._id == types._id
          });
          if (typeResult.length > 0) {
               return typeResult[0];
          }
     }
     return null;
}

/**
 * @function getVisibleAttributeView
 * @description find and returns all attributeviews of specified element
 * @param {Object} elementView 
 * @returns {Array}
 * @memberof Utils
 */
function getVisibleAttributeView(elementView) {
     let mAttriabuteView = elementView.attributeCompartment.subViews.filter(function (attrView) {
          return attrView.visible
     });
     return mAttriabuteView;
}

/**
 * @function getVisibleLiteralsView
 * @description find and returns all literalviews of specified element
 * @param {Object} elementView 
 * @returns {Array}
 * @memberof Utils
 */
function getVisibleLiteralsView(elementView) {
     let mAttriabuteView = elementView.enumerationLiteralCompartment.subViews.filter(function (attrView) {
          return attrView.visible
     });
     return mAttriabuteView;
}

/**
 * @function getVisibleOperationView
 * @description find and returns all operationviews of specified element
 * @param {Object} elementView 
 * @returns {Array}
 * @memberof Utils
 */
function getVisibleOperationView(elementView) {
     let operationView = elementView.operationCompartment.subViews.filter(function (operationView) {
          return operationView.visible
     });
     return operationView;
}

/**
 * @function getCoreDataTypeAttributeClass
 * @description find and returns list of classes that of CoreTypes
 * @param {Object} classes 
 * @returns {Array}
 * @memberof Utils
 */
function getCoreDataTypeAttributeClass(classes) {
     let arrCoreDataTypeAttr = [];

     if (openAPI.isModelDiagram()) {

          let mClassesView = dElement.getUMLClassView();

          forEach(mClassesView, function (mClassView) {
               let mAttriabuteView = mClassView.attributeCompartment.subViews.filter(function (attrView) {
                    return attrView.visible
               });
               /* Iterate to all attributes for check and add for qualified data type all Core Data Type */
               forEach(mAttriabuteView, function (attribView) {
                    let attrib = attribView.model;
                    if (isCoreDataType(attrib.type)) {
                         let coreType = getCoreDataType(attrib.type);
                         arrCoreDataTypeAttr.push(coreType);
                    }
               });
          });
     } else {
          forEach(classes, function (mClass) {
               /* Iterate to all attributes for check and add for qualified data type all Core Data Type */
               forEach(mClass.attributes, function (attrib) {

                    if (isCoreDataType(attrib.type)) {
                         let coreType = getCoreDataType(attrib.type);
                         arrCoreDataTypeAttr.push(coreType);
                    }
               });
          });
     }
     return arrCoreDataTypeAttr;
}

/**
 * @function getViewFromCurrentDiagram
 * @description find and returns view of specified element of current selected diagram
 * @param {Object} element 
 * @returns {Object}
 * @memberof Utils
 */
function getViewFromCurrentDiagram(element) {
     let mInterfaceViews = app.repository.getViewsOf(element).filter(e =>
          e.constructor === element.getViewType() &&
          e._parent instanceof type.UMLClassDiagram &&
          e._parent.name === openAPI.getExportElement().name
     );
     if (mInterfaceViews.length == 1) {
          return mInterfaceViews[0];
     }
     return null;
}

/**
 * @function getViewFromOther
 * @description find and returns view of specified element from the whole project
 * @param {Object} element 
 * @returns {Object}
 * @memberof Utils
 */
function getViewFromOther(element) {
     let elementViews = app.repository.getViewsOf(element).filter(e =>
          e.constructor === element.getViewType()
     );
     if (elementViews.length > 0) {
          return elementViews[0];
     }
     return null;
}
/**
 * @function fetchUMLInterfaceRealization
 * @description find and returns view of specified element from the whole project
 * @returns {Object}
 * @memberof Utils
 */
function fetchUMLInterfaceRealization() {
     let interfaceRealalization = [];
     if (openAPI.isModelPackage()) {
          interfaceRealalization = app.repository.select("@UMLInterfaceRealization");
     } else if (openAPI.isModelDiagram()) {
          interfaceRealalization = [];
          let interfaceRealalizationView = dElement.getUMLInterfaceRealizationView();
          forEach(interfaceRealalizationView, function (mView) {
               interfaceRealalization.push(mView.model);
          });
     }
     return interfaceRealalization;
}

function fetchUMLAssociation() {
     let interfaceAssociation = [];
     if (openAPI.isModelPackage()) {
          interfaceAssociation = app.repository.select("@UMLAssociation");
     } else if (openAPI.isModelDiagram()) {
          let interfaceAssociationViews = dElement.getUMLAssociationView();
          forEach(interfaceAssociationViews, function (umlAssocView) {
               interfaceAssociation.push(umlAssocView.model);
          });
     }
     return interfaceAssociation;
}


function initCoreTypes() {

     let result = app.repository.select('Core::@UMLPackage');
     result=result.filter(function(pkg){
          return pkg instanceof type.UMLPackage && pkg.name == 'Types';
     });

     // result = app.repository.select(result.name + '::@UMLPackage');
     let typePkg = result[0];
     let coreTypes = app.repository.select(typePkg.name + "::@UMLClass");
     setCoreTypes(coreTypes);

     console.log("CoreTypes initialized", getCoreTypes());
}
let mCoreTypes = [];

function setCoreTypes(coreTypes) {
     mCoreTypes = coreTypes;
}

function getCoreTypes() {
     return mCoreTypes;
}


module.exports.getViewFromOther = getViewFromOther;
module.exports.isCoreDataType = isCoreDataType;
module.exports.getCoreDataType = getCoreDataType;
module.exports.isString = isString;
module.exports.isEmpty = isEmpty;
module.exports.resetErrorBlock = resetErrorBlock;
module.exports.writeErrorToFile = writeErrorToFile;
module.exports.buildDescription = buildDescription;
module.exports.buildParameter = buildParameter;
module.exports.addAttributeType = addAttributeType;
module.exports.buildRequestBody = buildRequestBody;
module.exports.writeQueryParameters = writeQueryParameters;
module.exports.getEnumerationLiteral = getEnumerationLiteral;
module.exports.getCoreDataTypeAttributeClass = getCoreDataTypeAttributeClass;
module.exports.getVisibleAttributeView = getVisibleAttributeView;
module.exports.getVisibleOperationView = getVisibleOperationView;
module.exports.getVisibleLiteralsView = getVisibleLiteralsView;
module.exports.getViewFromCurrentDiagram = getViewFromCurrentDiagram;
module.exports.fetchUMLInterfaceRealization = fetchUMLInterfaceRealization;
module.exports.fetchUMLAssociation = fetchUMLAssociation;
module.exports.initCoreTypes = initCoreTypes;
module.exports.initJsonRuleType = initJsonRuleType;