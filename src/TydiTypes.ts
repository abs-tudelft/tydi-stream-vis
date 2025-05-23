class TydiEl {
    isStream: boolean = false
}

class TydiBits extends TydiEl {
    public width: number
    constructor(width: number) {
        super();
        this.width = Math.round(width);
    }
}

class TydiNull extends TydiEl {}

class TydiGroup extends TydiEl {
    public name: String
    public items: Record<string, TydiEl>

    constructor(name: String, items: Record<string, TydiEl>) {
        super();
        this.name = name;
        this.items = items;
    }
}

class TydiUnion extends TydiGroup {
    constructor(name: String, items: Record<string, TydiEl>) {
        super(name, items);
    }
}

class TydiStream extends TydiEl {
    isStream = true
    e: TydiEl
    n: number
    d: number
    c: number
    u: TydiEl

    constructor(e: TydiEl, n: number, d: number, c: number, u: TydiEl = new TydiNull()) {
        super();
        this.e = e;
        this.n = Math.round(n);
        this.d = Math.round(d);
        this.c = Math.round(c);
        this.u = u;
    }
}

class TydiStringStream extends TydiStream {
    constructor(n: number, d: number, c: number) {
        super(new TydiBits(8), n, d, c);
    }
}
