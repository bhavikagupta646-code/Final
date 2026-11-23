declare module "snarkjs" {
  const content: any;
  export default content;
  export const groth16: any;
  export const powersoftau: any;
  export const zKey: any;
}

declare module "circomlibjs" {
  export const buildEddsa: any;
  export const buildPoseidon: any;
  export const buildBabyjub: any;
}
