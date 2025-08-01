import './Tydi/utils.ts';

// Type definitions for the schema structure
export type SchemaType =
    | 'string'
    | 'date-time'
    | 'number'
    | 'boolean'
    | 'null'
    | 'array'
    | 'object';

export interface Schema {
    type: SchemaType;
    properties?: Record<string, Schema>;
    items?: Schema;
    nullable?: boolean;
    enum?: any[];
}

/**
 * Generate a schema from any JavaScript value
 * @param value - The value to analyze
 * @param options - Configuration options
 * @returns The generated schema
 */
export function generateSchema(
    value: unknown,
    options: { detectEnums?: boolean } = {}
): Schema {
    const { detectEnums = false } = options;

    // Handle null values
    if (value === null) {
        return { type: 'null' };
    }

    // Handle primitive types
    if (typeof value === 'string') {
        // Detect DateTime strings
        if (value.isDateTime()) {
            return { type: 'date-time' };
        }
        return { type: 'string' };
    }

    if (typeof value === 'number') {
        return { type: 'number' };
    }

    if (typeof value === 'boolean') {
        return { type: 'boolean' };
    }

    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) {
            // Empty array - assume any type for items
            return {
                type: 'array',
                // Explicitly don't fill in the type value, so empty arrays can be ignored for the schema merging
            };
        }

        // For non-empty arrays, merge schemas of all items
        const itemSchemas = value.map(item => generateSchema(item, options));
        const mergedItemSchema = mergeSchemas(itemSchemas);

        // Check for enum values if enabled
        if (detectEnums && value.every(item => typeof item === typeof value[0])) {
            const uniqueValues = [...new Set(value)];
            if (uniqueValues.length < value.length || uniqueValues.length <= 10) {
                const baseType = mergedItemSchema.type;
                if (baseType === 'string' || baseType === 'number' || baseType === 'boolean') {
                    return {
                        type: 'array',
                        items: {
                            type: baseType,
                            enum: uniqueValues
                        }
                    };
                }
            }
        }

        return {
            type: 'array',
            items: mergedItemSchema
        };
    }

    // Handle objects
    if (typeof value === 'object') {
        const properties: Record<string, Schema> = {};

        for (const [key, val] of Object.entries(value)) {
            properties[key] = generateSchema(val, options);
        }

        return {
            type: 'object',
            properties
        };
    }

    // Fallback for other types
    return { type: 'string', nullable: true };
}

/**
 * Process a collection of objects to determine which properties might be nullable
 * @param objects - Array of objects to analyze
 * @param options - Configuration options
 * @returns A schema representing the structure with nullable properties identified
 */
export function analyzeObjects<T extends Record<string, any>>(
    objects: T[],
    options: { detectEnums?: boolean } = {}
): Schema {
    if (objects.length === 0) {
        return { type: 'object', properties: {} };
    }

    // Collect all property keys across all objects
    const allKeys = new Set<string>();
    for (const obj of objects) {
        for (const key of Object.keys(obj)) {
            allKeys.add(key);
        }
    }

    const properties: Record<string, Schema> = {};

    // For each property, analyze its presence and types across all objects
    for (const key of allKeys) {
        const values = objects.map(obj => obj[key]);
        const presentValues = values.filter(v => v !== undefined);

        if (presentValues.length === 0) {
            properties[key] = { type: 'null', nullable: true };
            continue;
        }

        // If the property is missing in some objects, mark it as nullable
        const isNullable = presentValues.length < objects.length || presentValues.some(v => v === null);
        const nonNullValues = presentValues.filter(v => v !== null);

        if (nonNullValues.length === 0) {
            properties[key] = { type: 'null' };
            continue;
        }

        // Generate schema from the non-null values
        let propSchema: Schema;

        // Handle potential enums (but only for non-array, non-object values)
        if (options.detectEnums &&
            nonNullValues.every(v => typeof v === typeof nonNullValues[0]) &&
            !nonNullValues.some(v => Array.isArray(v) || (typeof v === 'object' && v !== null))) {
            const uniqueValues = [...new Set(nonNullValues)];
            const baseType = typeof nonNullValues[0];

            if ((uniqueValues.length < nonNullValues.length || uniqueValues.length <= 10) &&
                (baseType === 'string' || baseType === 'number' || baseType === 'boolean')) {
                propSchema = {
                    type: baseType as SchemaType,
                    enum: uniqueValues,
                    nullable: isNullable
                };
                properties[key] = propSchema;
                continue;
            }
        }

        // If not an enum or enum detection disabled, merge schemas
        const valueSchemas = nonNullValues.map(v => generateSchema(v, options));
        propSchema = mergeSchemas(valueSchemas);
        propSchema.nullable = isNullable;
        properties[key] = propSchema;
    }

    return {
        type: 'object',
        properties
    };
}

/**
 * Merge multiple schemas into one
 * @param schemas - The schemas to merge
 * @returns A merged schema
 */
function mergeSchemas(schemas: Schema[]): Schema {
    if (schemas.length === 0) {
        return { type: 'string', nullable: true };
    }

    if (schemas.length === 1) {
        return schemas[0];
    }

    // Check if all schemas have the same type
    const types = new Set(schemas.map(s => s.type));

    // Handle mixed null and non-null schemas
    if (types.has('null') && types.size > 1) {
        const nonNullSchemas = schemas.filter(s => s.type !== 'null');
        const result = mergeSchemas(nonNullSchemas);
        result.nullable = true;
        return result;
    }

    // If all schemas have the same type
    if (types.size === 1) {
        const type = schemas[0].type;

        if (type === 'object') {
            // Merge object properties
            const allKeys = new Set<string>();
            for (const schema of schemas) {
                if (schema.properties) {
                    for (const key of Object.keys(schema.properties)) {
                        allKeys.add(key);
                    }
                }
            }

            const properties: Record<string, Schema> = {};

            for (const key of allKeys) {
                const propSchemas: Schema[] = [];
                let keyMissingSomewhereFlag = false;

                for (const schema of schemas) {
                    if (schema.properties && key in schema.properties) {
                        propSchemas.push(schema.properties[key]);
                    } else {
                        keyMissingSomewhereFlag = true;
                    }
                }

                const merged = mergeSchemas(propSchemas);
                // Mark property as nullable if it doesn't exist in all objects
                if (keyMissingSomewhereFlag) {
                    merged.nullable = true;
                }
                properties[key] = merged;
            }

            return {
                type: 'object',
                properties
            };
        }

        if (type === 'array') {
            // Merge array item schemas
            const itemSchemas = schemas
                .map(schema => schema.items)
                .filter((schema): schema is Schema => schema !== undefined);

            return {
                type: 'array',
                items: mergeSchemas(itemSchemas)
            };
        }

        // For primitive types, check for enums
        const hasEnum = schemas.some(s => s.enum !== undefined);
        if (hasEnum) {
            const allEnumValues = new Set<any>();
            schemas.forEach(s => {
                if (s.enum) {
                    s.enum.forEach(v => allEnumValues.add(v));
                }
            });

            return {
                type,
                enum: [...allEnumValues]
            };
        }

        // For primitive types with same type, just return the type
        return { type };
    }

    // If types are different (not including null which was handled above)
    // We choose a common type or fall back to 'string'
    const hasNumber = types.has('number');
    const hasString = types.has('string');
    const hasBoolean = types.has('boolean');
    const hasArray = types.has('array');
    const hasObject = types.has('object');

    // If we have a mix of primitive types, choose string as the most flexible
    if ((hasNumber || hasString || hasBoolean) && !hasArray && !hasObject) {
        return { type: 'string' };
    }

    // Complex mixed case, fallback to string
    return { type: 'string', nullable: true };
}

/**
 * Process an array of objects to generate a schema that correctly handles nullable fields
 * @param data - The data array to analyze
 * @param options - Configuration options
 * @returns The generated schema
 */
export function schemaFromArray<T extends Record<string, any>>(
    data: T[],
    options: { detectEnums?: boolean } = {}
): Schema {
    if (!Array.isArray(data) || data.length === 0) {
        return { type: 'array', items: { type: 'object', properties: {} } };
    }

    // Check if all items are objects
    if (!data.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))) {
        // If not all items are objects, use the regular generateSchema
        return generateSchema(data, options);
    }

    // Special handling for arrays of objects
    const itemSchema = analyzeObjects(data, options);

    return {
        type: 'array',
        items: itemSchema
    };
}

/**
 * Process a JSON string and generate a schema
 * @param jsonString - The JSON string to process
 * @param options - Configuration options
 * @returns The generated schema
 */
export function schemaFromJSON(
    jsonString: string,
    options: { detectEnums?: boolean } = {}
): Schema {
    try {
        const data = JSON.parse(jsonString);

        // Special handling for arrays of objects
        if (Array.isArray(data) && data.length > 0 &&
            data.every(item => item !== null && typeof item === 'object' && !Array.isArray(item))) {
            return schemaFromArray(data, options);
        }

        return generateSchema(data, options);
    } catch (error) {
        throw new Error(`Invalid JSON string: ${(error as Error).message}`);
    }
}

/**
 * Example usage with nullable fields detection
 */
export function example() {
    const data = {
        users: [
            { id: 1, name: "Alice", age: 25, active: true },
            { id: 2, name: "Bob", active: false },
            { id: 3, name: "Charlie", age: 30, active: true }
        ]
    };

    // Regular schema generation
    const schema1 = generateSchema(data);

    // Special handling for array of objects with nullable field detection
    const schema2 = schemaFromArray(data.users, { detectEnums: true });

    console.log("Regular schema generation:");
    console.log(JSON.stringify(schema1, null, 2));

    console.log("\nWith nullable field detection:");
    console.log(JSON.stringify(schema2, null, 2));

    return { schema1, schema2 };
}