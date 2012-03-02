// (c) 2012 Salsita s.r.o.
// Dual-licensed under MIT license and GPL v2.

(function() {
  var ValidationError = require("xml2js").ValidationError;
  exports.makeValidator = function(schema) {
    return function(xpath, currentValue, newValue) {
      return validator(schema, xpath, currentValue, newValue);
    }
  };

  function validator(schema, xpath, currentValue, newValue) {
    var segments = xpath.split("/");
    // Only support absolute paths so remove the first (empty) segment.
    segments.splice(0, 1);
    var schemaNode;
    var schemaNodeName;
    var i;
    var properties = null;
    var nodeType;
    for (i = 0; i < segments.length; i++) {
      var isArray = false;
      var name = segments[i];
      if (i === 0) {
        // We're at the bottom of the stack so get the root item from the schema.
        // It is always an object.
        schemaNode = schema;
        schemaNodeName = schemaNode.name;
        nodeType = "object";
        if (name !== schemaNodeName) {
          // Oops, we're not the kind of object we expected.
          throw new ValidationError("Expected object " + schemaNodeName + " but found " + name);
        }
      }
      else {
        // Otherwise we use the name of this item to get its schema info from the
        // parent item's list of properties.
        schemaNode = properties[name];
        schemaNodeName = name;
        nodeType = schemaNode.type;
      }
      // Remember our properties for the next item in the stack.
      if (nodeType === "object") {
        properties = schemaNode.properties;
      }
      else {
        properties = null;
      }
      if (nodeType === "array") {
        // We're an array so we want the processing to apply to items in the
        // array.
        nodeType = schemaNode.items.type;
        properties = schemaNode.items.properties;
        isArray = true;
      }
    }
    // Now we've walked up the whole stack so we have the node type of the last item.
    if (nodeType !== "object") {
      if (newValue instanceof Object) {
        throw new ValidationError("Cannot assign an object to literal property " + name);
      }
      // Convert the datatype of the value if necessary.
      if (nodeType === "number" || nodeType === "integer") {
        newValue = Number(newValue);
      }
      // TODO: Could add more conversions here if we need them.
    }
    else {
      if (newValue instanceof Object) {
        // Check that all required properties are present
        for (propName in properties) {
          if (!(propName in newValue)) {
            if (properties[propName].required) {
              throw new ValidationError("Object " + name + " is missing required property " + propName);
            }
            else if (properties[propName].type === "array") {
              newValue[propName] = [];
            }
          }
        }
      }
      else {
        throw new ValidationError("Cannot assign a literal to object property " + name);
      }
    }
    if (isArray) {
      if (!currentValue) {
        // New array so make sure we return an array
        if (newValue && !isEmptyObj(newValue)) {
          return [newValue];
        }
        else {
          return [];
        }
      }
    }
    return newValue;
  }

  function isEmptyObj(obj) {
    if (!(obj instanceof Object)) {
      return false;
    }
    for(var prop in obj) {
      if(obj.hasOwnProperty(prop)) {
          return false;
      }
    }

    return true;
  }
}).call(this);
