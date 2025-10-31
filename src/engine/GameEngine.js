import { useFrame } from '@react-three/fiber/native';
import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

/**
 * GameEngine - Motor principal del juego
 * Maneja el loop de juego, entidades y sistemas
 */
export class GameEngine {
  constructor() {
    this.entities = new Map();
    this.systems = [];
    this.time = 0;
    this.deltaTime = 0;
    this.isPaused = false;
  }

  // Agregar una entidad al motor
  addEntity(id, entity) {
    this.entities.set(id, entity);
    return entity;
  }

  // Remover una entidad
  removeEntity(id) {
    this.entities.delete(id);
  }

  // Obtener una entidad por ID
  getEntity(id) {
    return this.entities.get(id);
  }

  // Agregar un sistema al motor
  addSystem(system) {
    this.systems.push(system);
  }

  // Actualizar todos los sistemas y entidades
  update(deltaTime) {
    if (this.isPaused) return;

    this.deltaTime = deltaTime;
    this.time += deltaTime;

    // Actualizar sistemas
    this.systems.forEach(system => {
      if (system.update) {
        system.update(deltaTime, this);
      }
    });

    // Actualizar entidades
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime);
      }
    });
  }

  // Pausar/reanudar el motor
  setPaused(paused) {
    this.isPaused = paused;
  }

  // Limpiar el motor
  clear() {
    this.entities.clear();
    this.systems = [];
    this.time = 0;
  }
}

/**
 * Hook para usar el motor de juego en componentes React
 */
export function useGameEngine(onCreate) {
  const engineRef = useRef(null);
  const [engine] = useState(() => {
    const engine = new GameEngine();
    engineRef.current = engine;
    if (onCreate) onCreate(engine);
    return engine;
  });

  useFrame((state, delta) => {
    engine.update(delta);
  });

  return engine;
}
