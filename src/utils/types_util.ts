export type IsNeverType<T> = [T] extends [never] ? true : never;

export type IfNeverThen<T, P, N> = [T] extends [never] ? P : N;

export type IfNotNeverThen<T, P, N> = [T] extends [never] ? N : P;
