describe("Schema-driven XML to JS object generation", function() {
  var parser, schema, obj, err;
  beforeEach(function() {
    obj = null;
    err = null;
    schema = 
    {
      "name":"Product",
      "properties":
      {
        "id":
        {
          "type":"number",
          "description":"Product identifier",
          "required":true
        },
        "name":
        {
          "type":"string",
          "description":"Name of the product",
          "required":true
        },
        "price":
        {
          "type":"number",
          "minimum":0,
          "required":true
        },
        "tags":
        {
          "type":"array",
          "items":
          {
            "type":"string"
          }
        },
        "numericTags":
        {
          "type":"array",
          "items":
          {
            "type":"number"
          }
        },
        "stock":
        {
          "type":"object",
          "properties":
          {
            "warehouse":
            {
              "type":"number",
              "required":true
            },
            "retail":
            {
              "type":"number"
            }
          }
        },
        "components":
        {
          "type":"array",
          "items":
          {
            "type":"object",
            "properties":
            {
              "description":
              {
                "type":"string"
              }
            }
          }
        }
      }
    };
    var xml2js = require("xml2js");
    var xml2js_schema = require("../../../xml2js-schema");
    parser = new xml2js.Parser({ validator: xml2js_schema.makeValidator(schema) });
    parser.addListener("end", function(result) {
      obj = result;
    });
    parser.addListener("error", function(message) {
      err = message;
    });
  });
  it("should always create an array for array properties", function() {
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
    expect(obj.tags instanceof Array).toBeTruthy();
    expect(obj.tags.length).toEqual(0);
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
    expect(obj.tags instanceof Array).toBeTruthy();
    expect(obj.tags.length).toEqual(1);
    expect(obj.tags[0]).toEqual("tablet");
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags><tags>apple</tags></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
    expect(obj.tags instanceof Array).toBeTruthy();
    expect(obj.tags.length).toEqual(2);
    expect(obj.tags[0]).toEqual("tablet");
    expect(obj.tags[1]).toEqual("apple");
  });
  it("should always create an array for array properties that are objects", function() {
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price><components><description>Touchscreen</description></components></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
    expect(obj.components instanceof Array).toBeTruthy();
  });
  it("should not create an array for non-array properties", function() {
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
    expect(obj.id instanceof Array).toBeFalsy();
  });
  it("should complain if a required property is missing", function() {
    var xml = "<Product><id>42</id><name>iPad</name><tags>tablet</tags></Product>";
    parser.parseString(xml);
    expect(err).toEqual("Object Product is missing required property price");
  });
  it("should complain if a required subobject are missing", function() {
    xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags></Product>";
    schema.properties.stock.required = true;
    parser.parseString(xml);
    expect(err).toEqual("Object Product is missing required property stock");
  });
  it("should complain if a required property is missing in a subobject", function() {
    xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags>";
    xml += "<stock><retail>123</retail></stock></Product>";
    parser.parseString(xml);
    expect(err).toEqual("Object stock is missing required property warehouse");
  });
  it("shouldn't complain if a required property is not missing in a subobject", function() {
    xml = "<Product><id>42</id><name>iPad</name><price>499</price><tags>tablet</tags>";
    xml += "<stock><warehouse>123</warehouse></stock></Product>";
    parser.parseString(xml);
    expect(err).toBeNull();
  });
  it("should represent numeric properties using numbers", function() {
    var xml = "<Product><id>42</id><name>iPad</name><price>499</price><numericTags>1</numericTags>";
    xml += "<stock><warehouse>55</warehouse></stock></Product>";
    debugger;
    parser.parseString(xml);
    expect(typeof obj.price).toEqual("number");
    expect(typeof obj.numericTags[0]).toEqual("number");
    expect(typeof obj.name).toEqual("string");
    expect(typeof obj.stock.warehouse).toEqual("number");
  });
});
