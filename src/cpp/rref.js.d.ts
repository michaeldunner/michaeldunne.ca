declare module "*/rref.js" {
    export interface EmscriptenModule {
        cwrap: (ident: string, returnType: string | null, argTypes: string[]) => (...args: any[]) => any;
        ccall: (ident: string, returnType: string | null, argTypes: string[], args: any[]) => any;
    }

    const factory: () => Promise<EmscriptenModule>;
    export default factory;
}
