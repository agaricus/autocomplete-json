var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var lodash_1 = require('lodash');
var DefaultSchemaVisitor = (function () {
    function DefaultSchemaVisitor(defaultVisit) {
        this.defaultVisit = defaultVisit;
    }
    DefaultSchemaVisitor.prototype.visitObjectSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitArraySchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitEnumSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitStringSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitNumberSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitBooleanSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitOneOfSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitAllOfSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitAnyOfSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    DefaultSchemaVisitor.prototype.visitNullSchema = function (schema, parameter) { return this.defaultVisit(schema, parameter); };
    return DefaultSchemaVisitor;
})();
exports.DefaultSchemaVisitor = DefaultSchemaVisitor;
var SchemaInspectorVisitor = (function (_super) {
    __extends(SchemaInspectorVisitor, _super);
    function SchemaInspectorVisitor() {
        _super.call(this, function (schema, segment) { return SchemaInspectorVisitor.EMPTY_ARRAY; });
    }
    SchemaInspectorVisitor.instance = function () {
        if (SchemaInspectorVisitor.INSTANCE === null) {
            SchemaInspectorVisitor.INSTANCE = new SchemaInspectorVisitor();
        }
        return SchemaInspectorVisitor.INSTANCE;
    };
    SchemaInspectorVisitor.prototype.visitObjectSchema = function (schema, segment) {
        var childSchema = schema.getProperty(segment);
        return childSchema ? [childSchema] : SchemaInspectorVisitor.EMPTY_ARRAY;
    };
    SchemaInspectorVisitor.prototype.visitArraySchema = function (schema, segment) {
        return [schema.getItemSchema()];
    };
    SchemaInspectorVisitor.prototype.visitOneOfSchema = function (schema, segment) {
        var _this = this;
        return lodash_1.flatten(schema.getSchemas().map(function (s) { return s.accept(_this, segment); }));
    };
    SchemaInspectorVisitor.prototype.visitAllOfSchema = function (schema, segment) {
        var _this = this;
        return lodash_1.flatten(schema.getSchemas().map(function (s) { return s.accept(_this, segment); }));
    };
    SchemaInspectorVisitor.prototype.visitAnyOfSchema = function (schema, segment) {
        var _this = this;
        return lodash_1.flatten(schema.getSchemas().map(function (s) { return s.accept(_this, segment); }));
    };
    SchemaInspectorVisitor.EMPTY_ARRAY = [];
    SchemaInspectorVisitor.INSTANCE = null;
    return SchemaInspectorVisitor;
})(DefaultSchemaVisitor);
var SchemaFlattenerVisitor = (function (_super) {
    __extends(SchemaFlattenerVisitor, _super);
    function SchemaFlattenerVisitor() {
        _super.call(this, function (schema, parameter) { return parameter.push(schema); });
    }
    SchemaFlattenerVisitor.instance = function () {
        if (SchemaFlattenerVisitor.INSTANCE === null) {
            SchemaFlattenerVisitor.INSTANCE = new SchemaFlattenerVisitor();
        }
        return SchemaFlattenerVisitor.INSTANCE;
    };
    SchemaFlattenerVisitor.prototype.visitOneOfSchema = function (schema, collector) {
        var _this = this;
        schema.getSchemas().forEach(function (childSchema) { return childSchema.accept(_this, collector); });
    };
    SchemaFlattenerVisitor.prototype.visitAllOfSchema = function (schema, collector) {
        var _this = this;
        schema.getSchemas().forEach(function (childSchema) { return childSchema.accept(_this, collector); });
    };
    SchemaFlattenerVisitor.prototype.visitAnyOfSchema = function (schema, collector) {
        var _this = this;
        schema.getSchemas().forEach(function (childSchema) { return childSchema.accept(_this, collector); });
    };
    SchemaFlattenerVisitor.INSTANCE = null;
    return SchemaFlattenerVisitor;
})(DefaultSchemaVisitor);
var SchemaRoot = (function () {
    function SchemaRoot(schemaRoot) {
        var _this = this;
        this.schemaRoot = schemaRoot;
        this.resolveRef = lodash_1.memoize(function (path) {
            var segments = path.split('/');
            function resolveInternal(partialSchema, refSegments) {
                if (lodash_1.isEmpty(refSegments)) {
                    return partialSchema;
                }
                var key = refSegments[0], tail = refSegments.slice(1);
                if (key === '#') {
                    return resolveInternal(partialSchema, tail);
                }
                var subSchema = partialSchema[key];
                return resolveInternal(subSchema, tail);
            }
            return resolveInternal(_this.schemaRoot, segments);
        });
        this.schema = this.wrap(schemaRoot);
    }
    SchemaRoot.prototype.getSchema = function () {
        return this.schema;
    };
    SchemaRoot.prototype.wrap = function (schema) {
        if (schema.$ref) {
            schema = this.resolveRef(schema.$ref);
        }
        if ((schema.type === 'object' || lodash_1.isObject(schema.properties)) && !schema.allOf && !schema.anyOf && !schema.oneOf) {
            return new ObjectSchema(schema, this);
        }
        else if ((schema.type === 'array' || lodash_1.isObject(schema.items)) && !schema.allOf && !schema.anyOf && !schema.oneOf) {
            return new ArraySchema(schema, this);
        }
        if (lodash_1.isArray(schema.oneOf) || schema.item) {
            return new OneOfSchema(schema, this);
        }
        else if (lodash_1.isArray(schema.anyOf)) {
            return new AnyOfSchema(schema, this);
        }
        else if (lodash_1.isArray(schema.allOf)) {
            return new AllOfSchema(schema, this);
        }
        else if (lodash_1.isObject(schema.enum)) {
            return new EnumSchema(schema, this);
        }
        switch (schema.type) {
            case 'boolean': return new BooleanSchema(schema, this);
            case 'number': return new NumberSchema(schema, this);
            case 'integer': return new NumberSchema(schema, this);
            case 'string': return new StringSchema(schema, this);
            case 'null': return new NullSchema(schema, this);
        }
        throw new Error("Illegal schema part: " + JSON.stringify(schema));
    };
    SchemaRoot.prototype.getPossibleTypes = function (segments) {
        var _this = this;
        if (segments.length === 0) {
            return this.getExpandedSchemas(this.getSchema());
        }
        return segments.reduce(function (schemas, segment) {
            var resolvedNextSchemas = schemas.map(function (schema) { return _this.getExpandedSchemas(schema); });
            var nextSchemas = lodash_1.flatten(resolvedNextSchemas).map(function (schema) { return schema.accept(SchemaInspectorVisitor.instance(), segment); });
            return lodash_1.flatten(nextSchemas);
        }, [this.getSchema()]);
    };
    SchemaRoot.prototype.getExpandedSchemas = function (schema) {
        if (schema instanceof CompositeSchema) {
            var schemas = [];
            this.getSchema().accept(SchemaFlattenerVisitor.instance(), schemas);
            return schemas;
        }
        return [schema];
    };
    return SchemaRoot;
})();
exports.SchemaRoot = SchemaRoot;
var BaseSchema = (function () {
    function BaseSchema(schema, schemaRoot) {
        this.schema = schema;
        this.schemaRoot = schemaRoot;
        this.schema = schema;
        this.schemaRoot = schemaRoot;
    }
    BaseSchema.prototype.getSchemaRoot = function () {
        return this.schemaRoot;
    };
    BaseSchema.prototype.getDescription = function () {
        return this.schema.description;
    };
    return BaseSchema;
})();
exports.BaseSchema = BaseSchema;
var ObjectSchema = (function (_super) {
    __extends(ObjectSchema, _super);
    function ObjectSchema(schema, schemaRoot) {
        var _this = this;
        _super.call(this, schema, schemaRoot);
        var properties = this.schema.properties || {};
        this.keys = Object.keys(properties);
        this.properties = this.keys.reduce(function (object, key) {
            object[key] = _this.getSchemaRoot().wrap(properties[key]);
            return object;
        }, {});
    }
    ObjectSchema.prototype.getKeys = function () {
        return this.keys;
    };
    ObjectSchema.prototype.getProperty = function (name) {
        return this.properties[name] || null;
    };
    ObjectSchema.prototype.getProperties = function () {
        return this.properties;
    };
    ObjectSchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    ObjectSchema.prototype.getDisplayType = function () {
        return 'object';
    };
    ObjectSchema.prototype.getAvailableKeys = function (partial) {
        if (!lodash_1.isObject(partial)) {
            return [];
        }
        return this.getKeys().filter(function (key) { return !partial.hasOwnProperty(key); });
    };
    ObjectSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitObjectSchema(this, parameter);
    };
    return ObjectSchema;
})(BaseSchema);
exports.ObjectSchema = ObjectSchema;
var ArraySchema = (function (_super) {
    __extends(ArraySchema, _super);
    function ArraySchema(schema, schemaRoot) {
        _super.call(this, schema, schemaRoot);
        this.itemSchema = this.getSchemaRoot().wrap(this.schema.items);
    }
    ArraySchema.prototype.getItemSchema = function () {
        return this.itemSchema;
    };
    ArraySchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    ArraySchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitArraySchema(this, parameter);
    };
    ArraySchema.prototype.getDisplayType = function () {
        var itemSchemaType = this.getItemSchema() && this.getItemSchema().getDisplayType()
            ? this.getItemSchema().getDisplayType()
            : 'any';
        return itemSchemaType + "[]";
    };
    return ArraySchema;
})(BaseSchema);
exports.ArraySchema = ArraySchema;
var EnumSchema = (function (_super) {
    __extends(EnumSchema, _super);
    function EnumSchema() {
        _super.apply(this, arguments);
    }
    EnumSchema.prototype.getValues = function () {
        return this.schema.enum;
    };
    EnumSchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    EnumSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitEnumSchema(this, parameter);
    };
    EnumSchema.prototype.getDisplayType = function () {
        return 'enum';
    };
    return EnumSchema;
})(BaseSchema);
exports.EnumSchema = EnumSchema;
var CompositeSchema = (function (_super) {
    __extends(CompositeSchema, _super);
    function CompositeSchema(schema, schemaRoot, keyWord) {
        var _this = this;
        _super.call(this, schema, schemaRoot);
        this.schemas = schema[keyWord].map(function (schema) { return _this.getSchemaRoot().wrap(schema); });
    }
    CompositeSchema.prototype.getSchemas = function () {
        return this.schemas;
    };
    CompositeSchema.prototype.getDefaultValue = function () {
        return null;
    };
    CompositeSchema.prototype.getDisplayType = function () {
        return this.getSchemas().map(function (s) { return s.getDisplayType(); }).join(' | ');
    };
    return CompositeSchema;
})(BaseSchema);
exports.CompositeSchema = CompositeSchema;
var AnyOfSchema = (function (_super) {
    __extends(AnyOfSchema, _super);
    function AnyOfSchema(schema, schemaRoot) {
        _super.call(this, schema, schemaRoot, 'anyOf');
    }
    AnyOfSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitAnyOfSchema(this, parameter);
    };
    return AnyOfSchema;
})(CompositeSchema);
exports.AnyOfSchema = AnyOfSchema;
var AllOfSchema = (function (_super) {
    __extends(AllOfSchema, _super);
    function AllOfSchema(schema, schemaRoot) {
        _super.call(this, schema, schemaRoot, 'allOf');
    }
    AllOfSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitAllOfSchema(this, parameter);
    };
    return AllOfSchema;
})(CompositeSchema);
exports.AllOfSchema = AllOfSchema;
var OneOfSchema = (function (_super) {
    __extends(OneOfSchema, _super);
    function OneOfSchema(schema, schemaRoot) {
        _super.call(this, schema, schemaRoot, 'oneOf');
    }
    OneOfSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitOneOfSchema(this, parameter);
    };
    return OneOfSchema;
})(CompositeSchema);
exports.OneOfSchema = OneOfSchema;
var NullSchema = (function (_super) {
    __extends(NullSchema, _super);
    function NullSchema() {
        _super.apply(this, arguments);
    }
    NullSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitNullSchema(this, parameter);
    };
    NullSchema.prototype.getDefaultValue = function () {
        return null;
    };
    NullSchema.prototype.getDisplayType = function () {
        return 'null';
    };
    return NullSchema;
})(BaseSchema);
exports.NullSchema = NullSchema;
var StringSchema = (function (_super) {
    __extends(StringSchema, _super);
    function StringSchema() {
        _super.apply(this, arguments);
    }
    StringSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitStringSchema(this, parameter);
    };
    StringSchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    StringSchema.prototype.getDisplayType = function () {
        return 'string';
    };
    return StringSchema;
})(BaseSchema);
exports.StringSchema = StringSchema;
var NumberSchema = (function (_super) {
    __extends(NumberSchema, _super);
    function NumberSchema() {
        _super.apply(this, arguments);
    }
    NumberSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitNumberSchema(this, parameter);
    };
    NumberSchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    NumberSchema.prototype.getDisplayType = function () {
        return 'number';
    };
    return NumberSchema;
})(BaseSchema);
exports.NumberSchema = NumberSchema;
var BooleanSchema = (function (_super) {
    __extends(BooleanSchema, _super);
    function BooleanSchema() {
        _super.apply(this, arguments);
    }
    BooleanSchema.prototype.accept = function (visitor, parameter) {
        return visitor.visitBooleanSchema(this, parameter);
    };
    BooleanSchema.prototype.getDefaultValue = function () {
        return this.schema['default'] || null;
    };
    BooleanSchema.prototype.getDisplayType = function () {
        return 'boolean';
    };
    return BooleanSchema;
})(BaseSchema);
exports.BooleanSchema = BooleanSchema;