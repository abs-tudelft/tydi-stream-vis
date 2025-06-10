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
