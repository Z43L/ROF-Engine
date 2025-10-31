/**
 * ObjectPool
 * Sistema de object pooling para reducir garbage collection
 * y mejorar el rendimiento
 */

class ObjectPool {
  constructor(factory, reset, initialSize = 10) {
    this.factory = factory;
    this.reset = reset;
    this.available = [];
    this.inUse = new Set();

    // Prellenar el pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.factory());
    }
  }

  /**
   * Obtiene un objeto del pool
   */
  acquire() {
    let obj;

    if (this.available.length > 0) {
      obj = this.available.pop();
    } else {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Devuelve un objeto al pool
   */
  release(obj) {
    if (!this.inUse.has(obj)) {
      console.warn('Attempting to release object not acquired from this pool');
      return;
    }

    this.inUse.delete(obj);
    this.reset(obj);
    this.available.push(obj);
  }

  /**
   * Libera todos los objetos del pool
   */
  releaseAll() {
    this.inUse.forEach(obj => {
      this.reset(obj);
      this.available.push(obj);
    });
    this.inUse.clear();
  }

  /**
   * Obtiene estadísticas del pool
   */
  get stats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }

  /**
   * Limpia el pool completamente
   */
  clear() {
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * Gestiona múltiples pools de objetos
 */
class PoolManager {
  constructor() {
    this.pools = new Map();
  }

  /**
   * Crea un nuevo pool
   */
  createPool(name, factory, reset, initialSize = 10) {
    if (this.pools.has(name)) {
      console.warn(`Pool '${name}' already exists`);
      return this.pools.get(name);
    }

    const pool = new ObjectPool(factory, reset, initialSize);
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Obtiene un pool existente
   */
  getPool(name) {
    return this.pools.get(name);
  }

  /**
   * Obtiene un objeto de un pool
   */
  acquire(poolName) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' does not exist`);
    }
    return pool.acquire();
  }

  /**
   * Devuelve un objeto a un pool
   */
  release(poolName, obj) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      throw new Error(`Pool '${poolName}' does not exist`);
    }
    pool.release(obj);
  }

  /**
   * Libera todos los objetos de todos los pools
   */
  releaseAll() {
    this.pools.forEach(pool => pool.releaseAll());
  }

  /**
   * Obtiene estadísticas de todos los pools
   */
  get stats() {
    const stats = {};
    this.pools.forEach((pool, name) => {
      stats[name] = pool.stats;
    });
    return stats;
  }

  /**
   * Limpia todos los pools
   */
  clear() {
    this.pools.forEach(pool => pool.clear());
    this.pools.clear();
  }
}

export { ObjectPool, PoolManager };
export default ObjectPool;
