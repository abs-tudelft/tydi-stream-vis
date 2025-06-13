import {type TydiEl, TydiStream} from "@/Tydi/TydiTypes.ts";

interface TransferElBase {
    id: number;
    last: string;
    lastParent: string;
    indexes: number[];
}

export type TransferEl = EmptyEl | DataEl

export interface EmptyEl extends TransferElBase {}

export interface DataEl extends TransferElBase {
    data: TydiEl;
}

export interface Transfer {
    id: number;
    stream: TydiStream;
    data: TransferElBase[];
    startIndex: number;
    endIndex: number;
    strobe: string;
}