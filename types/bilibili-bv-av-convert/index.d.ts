declare module 'bilibili-bv-av-convert' {
  function BVtoAV(bv: string): number;
  function AVtoBV(av: number): string;
  export { BVtoAV, AVtoBV }
}
