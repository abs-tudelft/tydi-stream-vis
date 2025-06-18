import * as Blockly from 'blockly/core'
import {
    bitBDef,
    groupBDef,
    memberBDef,
    streamBDef,
    streamletBDef,
    stringStreamBDef,
    unionBDef
} from "@/blocks/dslBlocks.ts";
import {pathToList, ObjectIndex, ArrayIndex} from "@/Tydi/utils.ts";
import type {DataEl, EmptyEl, Transfer, TransferEl} from "@/Tydi/TransferTypes.ts";

abstract class TydiExtendable {
    _block: Blockly.Block | null = null
    set block(block: Blockly.Block) {
        this._block = block
        this.dataPath = this._block.getFieldValue("MAPPING")
        if (this.dataPath == null) return
        // For some reason the analyzer doesn't let me use string.replaceAll()
        this.dataPathList = pathToList(this.dataPath)
    }
    dataPath: string | null = null
    dataPathList: (ObjectIndex | ArrayIndex)[] = []
    tydiPath: string | null = null

    getChildren(): Record<string, TydiEl> {
        return {}
    }
}

export abstract class TydiEl extends TydiExtendable {
    isStream: boolean = false
    abstract type: string
    parent: TydiEl | TydiStreamlet | null = null

    get parentStream(): TydiStream | null {
        let p: TydiEl | TydiStreamlet | null = this
        do {
            if (p === null || p === undefined || p instanceof TydiStreamlet) { return null }
            p = p.parent
        } while (!(p instanceof TydiStream))
        return p as TydiStream
    }

    get relativePathList(): (ObjectIndex | ArrayIndex)[] {
        let parentIndex = 0
        for (let i = this.dataPathList.length - 1; i >= 0; i--) {
            if (this.dataPathList[i] instanceof ArrayIndex) {
                parentIndex = i
                break
            }
        }
        return this.dataPathList.slice(parentIndex+1)
    }

    setPath(path: string) {
        this.tydiPath = path
        for (let [key, item] of Object.entries(this.getChildren())) {
            item.setPath(`${path}.${key}`)
        }
    }

    findStreams(directNestingOnly: boolean = false): TydiStream[] {
        let streams: TydiStream[] = []
        for (let [key, item] of Object.entries(this.getChildren())) {
            streams.push(... item.findStreams(directNestingOnly))
        }
        if (this instanceof TydiStream) {
            streams = [this, ...streams]
        }
        return streams
    }

    get width(): number {
        return Object.values(this.getChildren()).reduce((acc, cur) => acc + cur.width, 0);
    }

    getItemsFlat(): TydiEl[] {
        return Object.values(this.getChildren()).filter(c => !c.isStream).flatMap(c => c.getItemsFlat())
    }

    static fromBlock(block: Blockly.Block): TydiEl {
        const nullEl = new TydiNull()
        nullEl.block = block

        switch (block.type) {
            case streamBDef.type:
                return TydiStream.fromBlock(block)
            case stringStreamBDef.type:
                return TydiStringStream.fromBlock(block)
            case groupBDef.type:
                return TydiGroup.fromBlock(block)
            case unionBDef.type:
                return TydiUnion.fromBlock(block)
            case bitBDef.type:
                return TydiBits.fromBlock(block)
            case 'logic_null':
                return nullEl
        }
        return nullEl
    }

    abstract repr(): String
    abstract physRepr(): String
}

export class TydiBits extends TydiEl {
    type = "Bits"
    public _width: number
    constructor(width: number) {
        super();
        this._width = Math.round(width);
    }

    // This is a getter because it overloads the method of TydiEl
    get width(): number {
        return this._width;
    }

    getItemsFlat(): TydiEl[] {
        return [this]
    }

    static fromBlock(block: Blockly.Block): TydiBits {
        if (block.type !== bitBDef.type) {
            throw new Error(`Expected block of type ${bitBDef.type}, got ${block.type}`)
        }
        const bitWidth = block.getFieldValue(bitBDef.argMap.WIDTH)
        const el = new TydiBits(bitWidth);
        el.block = block
        return el
    }

    repr(): String {
        return `Bits<${this.width}>`;
    }

    physRepr(): String {
        return this.repr();
    }
}

export class TydiNull extends TydiEl {
    type = "Null"
    repr(): String {
        return 'Null';
    }

    physRepr(): String {
        return this.repr();
    }
}

export class TydiGroup extends TydiEl {
    type = "Group"
    public name: String
    public items: Record<string, TydiEl>

    constructor(name: String, items: Record<string, TydiEl>) {
        super();
        this.name = name;
        this.items = items;
        for (let item of Object.values(this.items)) {
            item.parent = this
        }
    }

    get numItems(): number {
        return Object.values(this.items).length
    }

    getChildren(): Record<string, TydiEl> {
        return this.items
    }

    static fromBlock(block: Blockly.Block): TydiGroup {
        if (block.type !== groupBDef.type) {
            throw new Error(`Expected block of type ${groupBDef.type}, got ${block.type}`)
        }
        const groupName = block.getFieldValue(groupBDef.argMap.NAME);
        const memberItems: Record<string, TydiEl> = {}

        const firstMemberBlock = block.getInputTargetBlock(groupBDef.argMap.FIELDS)
        if (!firstMemberBlock) {
            const el = new TydiGroup(groupName, memberItems);
            el.block = block
            return el
        }

        const memberBlocks: Blockly.Block[] = [firstMemberBlock]
        let memberBlock = firstMemberBlock
        while (memberBlock.getNextBlock()) {
            memberBlock = memberBlock.getNextBlock()!
            memberBlocks.push(memberBlock)
        }

        for (let memberBlock of memberBlocks) {
            const memberName = memberBlock.getFieldValue(memberBDef.argMap.MEMBER_NAME)
            const memberItem = memberBlock.getInputTargetBlock(memberBDef.argMap.MEMBER_VALUE)
            memberItems[memberName] = memberItem ? TydiEl.fromBlock(memberItem) : new TydiNull()
        }
        const el = new TydiGroup(groupName, memberItems);
        el.block = block
        return el
    }

    repr(): String {
        const itemsRepr = Object.values(this.items).map(item => item.repr()).join(', ')
        return `Group<${itemsRepr}>`;
    }

    physRepr(): String {
        const itemsRepr = Object.values(this.items).filter(item => !item.isStream).map(item => item.physRepr()).join(', ')
        if (itemsRepr.length === 0) return 'Group<Null>'
        return `Group<${itemsRepr}>`;
    }
}

export class TydiUnion extends TydiGroup {
    type = "Union"
    constructor(name: String, items: Record<string, TydiEl>) {
        super(name, items);
    }

    get tagWidth(): number {
        return Math.ceil(Math.log2(this.numItems))
    }

    /// Finds the maximum bitWidth of the children
    get unionWidth(): number {
        const tydiEls = Object.values(this.getChildren()).filter(c => !c.isStream);
        // The following is shorter, but all the arguments go on the stack. Does this matter with our small objects? Not really I suppose.
        // return Math.max(... tydiEls.map(o => o.width))
        return tydiEls.reduce((acc, cur) => Math.max(acc, cur.width), 0);
    }

    get width(): number {
        return this.unionWidth + this.tagWidth
    }

    getItemsFlat(): TydiEl[] {
        const union = new TydiBits(this.unionWidth)
        union.tydiPath = `${this.tydiPath}.union`
        union.dataPath = `${this.dataPath}:data`
        // Todo: The block the union corresponds to is dynamic. Not sure how to handle.
        const tag = new TydiBits(this.tagWidth)
        tag.tydiPath = `${this.tydiPath}.tag`
        tag.dataPath = `${this.dataPath}:type`
        if (this._block) {
            tag.block = this._block
        }
        return [tag, union]
    }

    static fromBlock(block: Blockly.Block): TydiUnion {
        if (block.type !== unionBDef.type) {
            throw new Error(`Expected block of type ${unionBDef.type}, got ${block.type}`)
        }
        const unionName = block.getFieldValue(unionBDef.argMap.NAME);
        const memberItems: Record<string, TydiEl> = {}

        const firstMemberBlock = block.getInputTargetBlock(groupBDef.argMap.FIELDS)
        if (!firstMemberBlock) {
            const el = new TydiUnion(unionName, memberItems)
            el.block = block
            return el
        }

        const memberBlocks: Blockly.Block[] = [firstMemberBlock]
        let memberBlock = firstMemberBlock
        while (memberBlock.getNextBlock()) {
            memberBlock = memberBlock.getNextBlock()!
            memberBlocks.push(memberBlock)
        }

        for (let memberBlock of memberBlocks) {
            const memberName = memberBlock.getFieldValue(memberBDef.argMap.MEMBER_NAME)
            const memberItem = memberBlock.getInputTargetBlock(memberBDef.argMap.MEMBER_VALUE)
            memberItems[memberName] = memberItem ? TydiEl.fromBlock(memberItem) : new TydiNull()
        }
        const el = new TydiUnion(unionName, memberItems)
        el.block = block
        return el
    }

    repr(): String {
        const itemsRepr = Object.values(this.items).map(item => item.repr()).join(', ')
        return `Union<${itemsRepr}>`;
    }
}

export class TydiStream extends TydiEl {
    type = "Stream"
    isStream = true
    name: String
    e: TydiEl
    n: number
    d: number
    c: number
    u: TydiEl
    childStreams: TydiStream[] = []

    constructor(name: String, e: TydiEl, n: number, d: number, c: number, u: TydiEl = new TydiNull()) {
        super();
        this.name = name;
        this.e = e;
        this.e.parent = this
        this.n = Math.round(n);
        this.d = Math.round(d);
        this.c = Math.round(c);
        this.u = u;
        this.u.parent = this
        this.childStreams = this.e.findStreams(true)
    }

    findStreams(directNestingOnly: boolean = false): TydiStream[] {
        if (directNestingOnly) {
            return [this]
        }
        return super.findStreams(directNestingOnly);
    }

    packetsToTransfers(packets: TransferEl[]): Transfer[] {
        type tState = "start" | "data" | "end"
        let state: tState = "start"
        const transfers: Transfer[] = []
        let i = 0
        let transfer: Transfer = {
            id: 0,
            stream: this,
            data: [],
            startIndex: 0,
            endIndex: 0,
            strobe: "",
        }
        for (let packet of packets) {
            // When a new transfer is started, initialize clean transfer object
            if (state === "start") {
                transfer = {
                    id: i++,
                    stream: this,
                    data: [],
                    startIndex: 0,
                    endIndex: 0,
                    strobe: "1".repeat(this.d),
                }
                state = "data"
            }
            // If this packet is an empty one
            if (packet.empty === true) {
                // First push the previous transfer
                if (transfer.data.length > 0) {
                    transfer.endIndex = transfer.data.length - 1
                    transfers.push(transfer)
                }
                // Push a transfer with the empty packet
                transfers.push({
                    id: i++,
                    stream: this,
                    data: [packet],
                    startIndex: 0,
                    endIndex: 1,
                    strobe: "0".repeat(this.d),
                })
                state = "start"
                continue
            }
            // If it does contain data, push it in the transfer
            transfer.data.push(packet)
            // If the packet is last of one of its dimensions, or the transfer is full
            if (packet.last.includes("1") || transfer.data.length === this.n) {
                transfer.endIndex = transfer.data.length-1
                transfers.push(transfer)
                state = "start"
            }
        }
        return transfers
    }

    getChildren(): Record<string, TydiEl> {
        return {
            e: this.e,
            u: this.u,
        }
    }

    static fromBlock(block: Blockly.Block): TydiStream {
        if (block.type !== streamBDef.type) {
            throw new Error(`Expected block of type ${streamBDef.type}, got ${block.type}`)
        }
        const streamName = block.getFieldValue(streamBDef.argMap.NAME);
        const n = block.getFieldValue(streamBDef.argMap.N)
        const d = block.getFieldValue(streamBDef.argMap.D)
        const c = block.getFieldValue(streamBDef.argMap.C)
        const itemBlock = block.getInputTargetBlock(streamBDef.argMap.E)
        const item = itemBlock ? TydiEl.fromBlock(itemBlock) : new TydiNull()
        const userBlock = block.getInputTargetBlock(streamBDef.argMap.U)
        const user = userBlock ? TydiEl.fromBlock(userBlock) : new TydiNull()
        const el = new TydiStream(streamName, item, n, d, c, user);
        el.block = block
        return el
    }

    dataToElements(data: any[] | any, last: string = "", indexes: number[] = []): TransferEl[] {
        // Fixme the id is for sure wrong
        const d = last.length
        const maxNesting = this.dNesting + this.d
        const isArray = Array.isArray(data)
        const isEmpty = !isArray && d < maxNesting
        if (isEmpty) {
            const el: EmptyEl = {
                id: 0,
                last: last.slice(this.dNesting),
                lastParent: last.slice(0, this.dNesting),
                indexes: indexes,
                empty: true
            }
            return [el]
        }
        if (d === maxNesting) {
            const el: DataEl = {
                id: 0,
                last: last.slice(this.dNesting),
                lastParent: last.slice(0, this.dNesting),
                indexes: indexes,
                data: data
            }
            return [el]
        }
        const dataLength = data.length
        const nonEndingLast = "0".repeat(d+1)
        const nonLastElements: TransferEl[] = data.slice(0, dataLength-1).flatMap((subData: any[], i: number) => this.dataToElements(subData, nonEndingLast, [...indexes, i]))
        const lastElements: TransferEl[] = this.dataToElements(data[dataLength-1], last + "1", [...indexes, dataLength-1])
        return [...nonLastElements, ...lastElements]
    }

    repr(): String {
        const eRepr = this.e.repr()
        if (this.d <= 1) {
            return `Stream<${eRepr}>`;
        }
        return `Stream{${this.d}}<${eRepr}>`;
    }

    physRepr(): String {
        if (this.e instanceof TydiStream) {
            return `Stream<Null>`
        }
        const eRepr = this.e.physRepr()
        if (this.d <= 1) {
            return `Stream<${eRepr}>`;
        }
        return `Stream{${this.d}}<${eRepr}>`;
    }

    get dNesting() {
        return (this.dataPathList.filter(item => item instanceof ArrayIndex).length ?? 0) - this.d + 1
    }
}

export class TydiStringStream extends TydiStream {
    constructor(name: String, n: number, d: number, c: number) {
        super(name, new TydiBits(8), n, d, c);
    }

    static fromBlock(block: Blockly.Block): TydiStream {
        const streamName = block.getFieldValue(streamBDef.argMap.NAME);
        const n = block.getFieldValue(streamBDef.argMap.N)
        const d = block.getFieldValue(streamBDef.argMap.D)
        const c = block.getFieldValue(streamBDef.argMap.C)
        const el = new TydiStringStream(streamName, n, d, c);
        el.block = block
        el.e.dataPath = el.dataPath
        return el
    }
}

export class TydiStreamlet extends TydiExtendable {
    name: String
    streams: Record<string, TydiStream>

    constructor(name: String, streams: Record<string, TydiStream> = {}) {
        super();
        this.name = name;
        this.streams = streams;
        Object.values(this.streams).forEach((stream: TydiStream) => { stream.parent = this })
    }

    getChildren(): Record<string, TydiStream> {
        return this.streams
    }

    static fromBlock(block: Blockly.Block): TydiStreamlet {
        const name = block.getFieldValue(streamletBDef.argMap.NAME);
        const streamBlock = block.getInputTargetBlock(streamletBDef.argMap.STREAM);
        let streams: Record<string, TydiStream> = {}
        if (streamBlock && [streamBDef.type, stringStreamBDef.type].includes(streamBlock.type)) {
            const stream = TydiEl.fromBlock(streamBlock)
            stream.dataPath = streamBlock.getFieldValue("MAPPING") ?? "root"
            stream.setPath("root")
            // TODO for now we only have one stream so this is fine
            if (stream instanceof TydiStream) {
                streams["stream"] = stream
            }
        }
        const el = new TydiStreamlet(name, streams);
        el.block = block
        return el
    }
}
