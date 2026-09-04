/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface GPUAdapter {
  features: {
    has: (name: string) => boolean;
  };
}

interface GPU {
  requestAdapter: (options?: unknown) => Promise<GPUAdapter | null>;
}

interface Navigator {
  readonly gpu?: GPU;
}
