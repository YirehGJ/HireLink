// src/firebase/error-emitter.ts
import { EventEmitter } from 'events';
import type { FirestorePermissionError } from './errors';

type ErrorEvents = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// We need to declare the type of the emitter to get type-safe events
declare interface TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> {
  on<E extends keyof T>(event: E, listener: T[E]): this;
  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean;
}

class TypedEventEmitter<T extends Record<string, (...args: any[]) => void>> extends EventEmitter {}

export const errorEmitter = new TypedEventEmitter<ErrorEvents>();
