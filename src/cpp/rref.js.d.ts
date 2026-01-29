declare module "*/rref.js" {
    export interface EmscriptenModule {
        cwrap: (ident: string, returnType: string | null, argTypes: string[]) => (...args: any[]) => any;
        ccall: (ident: string, returnType: string | null, argTypes: string[], args: any[]) => any;
        _rref: (dataPtr: number, rows: number, cols: number) => void;
        HEAPF64: Float64Array;
        _malloc: (size: number) => number;
        _free: (ptr: number) => void;
    }

    const factory: () => Promise<EmscriptenModule>;
    export default factory;
}
