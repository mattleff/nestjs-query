import { Class } from './class.type';

export type MetaValue<MetaType> = MetaType | undefined;

type ClassDecoratorDataFunc<Data> = (data: Data) => ClassDecorator;
export const classMetadataDecorator = <Data>(key: string): ClassDecoratorDataFunc<Data> => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (data: Data) => (target: Function): void => {
    Reflect.defineMetadata(key, data, target);
  };
};

export function getClassMetadata<DTO, Data>(DTOClass: Class<DTO>, key: string): MetaValue<Data> {
  return Reflect.getOwnMetadata(key, DTOClass) as MetaValue<Data>;
}

abstract class Reflector {
  constructor(readonly metaKey: string) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected getMetadata<Data>(target: Function): MetaValue<Data> {
    return Reflect.getOwnMetadata(this.metaKey, target) as MetaValue<Data>;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  protected defineMetadata = <Data>(data: Data, target: Function): void => {
    Reflect.defineMetadata(this.metaKey, data, target);
  };
}

export class ValueReflector extends Reflector {
  set<DTO, Data>(DTOClass: Class<DTO>, data: Data): void {
    this.defineMetadata(data, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>): MetaValue<Data> {
    return this.getMetadata(DTOClass);
  }

  isDefined<DTO>(DTOClass: Class<DTO>): boolean {
    return this.get(DTOClass) !== undefined;
  }

  memoize<DTO, Data>(DTOClass: Class<DTO>, fn: () => Data): Data {
    const existing = this.get<DTO, Data>(DTOClass);
    if (existing) {
      return existing;
    }
    const result = fn();
    this.set(DTOClass, result);
    return result;
  }
}

export class ArrayReflector extends Reflector {
  append<DTO, Data>(DTOClass: Class<DTO>, data: Data): void {
    const metadata = getClassMetadata<DTO, Data[]>(DTOClass, this.metaKey) ?? [];
    metadata.push(data);
    this.defineMetadata(metadata, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>): MetaValue<Data[]> {
    return this.getMetadata(DTOClass);
  }
}

export class MapReflector<K = string> extends Reflector {
  set<DTO, Data>(DTOClass: Class<DTO>, key: K, value: Data): void {
    const metadata = getClassMetadata<DTO, Map<K, Data>>(DTOClass, this.metaKey) ?? new Map<K, Data>();
    metadata.set(key, value);
    this.defineMetadata(metadata, DTOClass);
  }

  get<DTO, Data>(DTOClass: Class<DTO>, key: K): MetaValue<Data> {
    return this.getMetadata<Map<K, Data>>(DTOClass)?.get(key);
  }

  has<DTO>(DTOClass: Class<DTO>, key: K): boolean {
    return this.getMetadata<Map<K, unknown>>(DTOClass)?.has(key) ?? false;
  }

  memoize<DTO, Data>(DTOClass: Class<DTO>, key: K, fn: () => Data): Data {
    const existing = this.get<DTO, Data>(DTOClass, key);
    if (existing) {
      return existing;
    }
    const result = fn();
    this.set(DTOClass, key, result);
    return result;
  }
}
