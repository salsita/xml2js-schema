// (c) 2012 Salsita s.r.o.
// Dual-licensed under MIT license and GPL v2.

(function() {
  exports.validator = (function() {
    var ValidationError = require("xml2js").ValidationError;
    return function(schema, obj, stack, nodeName) {
      var s = stack[stack.length - 1];
      var schemaNode;
      var schemaNodeName;
      var i, name;
      var properties = null;
      var nodeType;
      for (i = 0; i < stack.length+1; i++) {
        if (i < stack.length) {
          name = stack[i]["#name"];
        }
        else {
          name = nodeName;
        }
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
          // If we're at the top of the stack and our value is not an array yet
          // then make it into an array. That way it will be an array even if it ends
          // up with less than two items in it.
          if ((i === stack.length) && !(s[nodeName] instanceof Array)) {
            s[nodeName] = [];
          }
        }
      }
      // Now we've walked up the whole stack so we have the node type of the last item.
      if (nodeType !== "object") {
        if (obj instanceof Object) {
          throw new ValidationError("Cannot assign an object to literal property " + name);
        }
        // Convert the datatype of the value if necessary.
        if (nodeType === "number" || nodeType === "integer") {
          obj = Number(obj);
        }
        // TODO: Could add more conversions here if we need them.
      }
      else {
        if (obj instanceof Object) {
          // Check that all required properties are present
          for (propName in properties) {
            if (properties[propName].required && !(propName in obj)) {
              throw new ValidationError("Object " + name + " is missing required property " + propName);
            }
          }
        }
        else {
          throw new ValidationError("Cannot assign a literal to object property " + name);
        }
      }
      return obj;
    }
  })();
}).call(this);
