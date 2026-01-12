interface Emit<T> {
  on(callback: (value: T) => void): () => void;
  emit(value: T): void;
  clear(): void;
}

class Emitter<T> implements Emit<T> {
  private listeners = new Set<(value: T) => void>();

  on(cb: (value: T) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  emit(value: T) {
    this.listeners.forEach((cb) => cb(value));
    this.clear();
  }

  clear() {
    this.listeners.clear();
  }
}

type EmitterMapType<T = unknown> = Record<string, Emit<T>>;
const emitters: EmitterMapType = {};

export const registerEmitter = <T>(key: string) => {
  if (!emitters[key]) {
    emitters[key] = new Emitter<T>();
  }
};

export const removeEmitter = (key: string) => {
  delete emitters[key];
};

export const getEmitter = <T>(key: string): Emit<T> => {
  const emitter = emitters[key];
  if (!emitter) {
    throw new Error(`Emitter "${key}" not registered`);
  }
  return emitter as Emit<T>;
};
