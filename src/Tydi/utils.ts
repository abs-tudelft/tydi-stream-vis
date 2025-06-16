export abstract class IndexPart {
    abstract type: string;
}

export class ObjectIndex extends IndexPart {
    type = "ObjectIndex";
    constructor(public name: string) {
        super();
    }
}

export class ArrayIndex extends IndexPart {
    type = "ArrayIndex";
}

export function pathToList(path: string): (ObjectIndex | ArrayIndex)[] {
    return path.split("[]").join(".[]").split(".").slice(1)
        .flatMap(pathSegment =>
            pathSegment === "[]" ? [new ArrayIndex] : new ObjectIndex(pathSegment)
        )
}

export function listToPath(path: (ObjectIndex | ArrayIndex)[]): string {
    let pathString = ''
    for (let pathEl of path) {
        if (pathEl instanceof ArrayIndex) {
            pathString += '[]'
        } else {
            pathString += '.' + pathEl.name
        }
    }
    return pathString
}

String.prototype.isDateTime = function (this: string): boolean {
    return this.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$/) !== null
}

/**
 * Converts a snake_case string to camelCase.
 *
 * @returns The converted string in camelCase.
 */
String.prototype.snake2camel = function (this: string): string {
    if (!this) return ""

    return this.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

/**
 * Converts a snake_case string to PascalCase.
 *
 * @returns The converted string in PascalCase.
 */
String.prototype.snake2pascal = function (this: string): string {
    if (!this) return ""

    return this.snake2camel().replace(/^\w/, (c) => c.toUpperCase());
}

// Extend the String interface to include the string manipulators
declare global {
    interface String {
        snake2camel(): string;
        snake2pascal(): string;
        isDateTime(): boolean;
    }
}
