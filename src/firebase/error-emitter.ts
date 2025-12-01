// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';

type EventMap = { [event: string]: (...args: any[]) => void };

export class TypedEventEmitter<T extends EventMap> {
  private readonly emitter = new EventEmitter();

  on<E extends keyof T & string>(event: E, listener: T[E]): this {
    this.emitter.on(event, listener);
    return this;
  }

  off<E extends keyof T & string>(event: E, listener: T[E]): this {
    this.emitter.off(event, listener);
    return this;
  }

  emit<E extends keyof T & string>(event: E, ...args: Parameters<T[E]>): boolean {
    return this.emitter.emit(event, ...args);
  }
}

interface ErrorEvents {
  error: (err: Error) => void;
  recovered: () => void;
  [key: string]: (...args: any[]) => void; // índice para cumplir EventMap
}

export const errorEmitter = new TypedEventEmitter<ErrorEvents>();
