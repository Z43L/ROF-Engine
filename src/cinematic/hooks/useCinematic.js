/**
 * HOOKS - React hooks para cinemáticas
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import { CinematicManager } from '../managers/CinematicManager';
import { Timeline } from '../core/TimelineEngine';
import { CinematicState, CinematicEvent } from '../types';
import { getGlobalEventBus } from '../core/EventBus';

/**
 * Hook principal para manejar cinemáticas
 */
export function useCinematic(config) {
  const [state, setState] = useState(CinematicState.IDLE);
  const [progress, setProgress] = useState(0);
  const managerRef = useRef(null);
  const cinematicRef = useRef(null);
  const eventBus = useMemo(() => getGlobalEventBus(), []);

  // Inicializar manager
  useEffect(() => {
    managerRef.current = new CinematicManager();

    return () => {
      if (managerRef.current) {
        managerRef.current.clear();
      }
    };
  }, []);

  // Crear cinemática
  useEffect(() => {
    if (!managerRef.current || !config) return;

    const cinematic = managerRef.current.register({
      ...config,
      onStart: (c) => {
        setState(CinematicState.PLAYING);
        if (config.onStart) config.onStart(c);
      },
      onComplete: (c) => {
        setState(CinematicState.COMPLETED);
        if (config.onComplete) config.onComplete(c);
      },
      onError: (error) => {
        setState(CinematicState.ERROR);
        if (config.onError) config.onError(error);
      }
    });

    cinematicRef.current = cinematic;

    return () => {
      if (cinematic) {
        cinematic.destroy();
      }
    };
  }, [config]);

  // Update loop
  useFrame((_, delta) => {
    if (managerRef.current) {
      managerRef.current.update(delta);

      if (cinematicRef.current) {
        setProgress(cinematicRef.current.getProgress());
      }
    }
  });

  const play = useCallback(async () => {
    if (cinematicRef.current) {
      await cinematicRef.current.play();
    }
  }, []);

  const pause = useCallback(() => {
    if (cinematicRef.current) {
      cinematicRef.current.pause();
      setState(CinematicState.PAUSED);
    }
  }, []);

  const resume = useCallback(() => {
    if (cinematicRef.current) {
      cinematicRef.current.resume();
      setState(CinematicState.PLAYING);
    }
  }, []);

  const stop = useCallback(() => {
    if (cinematicRef.current) {
      cinematicRef.current.stop();
      setState(CinematicState.READY);
      setProgress(0);
    }
  }, []);

  const skip = useCallback(() => {
    if (cinematicRef.current) {
      cinematicRef.current.skip();
    }
  }, []);

  return {
    state,
    progress,
    play,
    pause,
    resume,
    stop,
    skip,
    cinematic: cinematicRef.current,
    isPlaying: state === CinematicState.PLAYING,
    isPaused: state === CinematicState.PAUSED,
    isCompleted: state === CinematicState.COMPLETED
  };
}

/**
 * Hook para timelines
 */
export function useTimeline(config) {
  const timelineRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    timelineRef.current = new Timeline({
      ...config,
      onStart: () => {
        setIsPlaying(true);
        if (config.onStart) config.onStart();
      },
      onComplete: () => {
        setIsPlaying(false);
        if (config.onComplete) config.onComplete();
      },
      onUpdate: (timeline, time) => {
        setCurrentTime(time);
        if (config.onUpdate) config.onUpdate(timeline, time);
      }
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.stop();
      }
    };
  }, [config]);

  useFrame((_, delta) => {
    if (timelineRef.current) {
      timelineRef.current.update(delta);
    }
  });

  const play = useCallback(() => {
    timelineRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    timelineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    timelineRef.current?.resume();
  }, []);

  const stop = useCallback(() => {
    timelineRef.current?.stop();
    setCurrentTime(0);
  }, []);

  const seek = useCallback((time) => {
    timelineRef.current?.seek(time);
  }, []);

  return {
    timeline: timelineRef.current,
    isPlaying,
    currentTime,
    progress: timelineRef.current ? currentTime / timelineRef.current.duration : 0,
    play,
    pause,
    resume,
    stop,
    seek
  };
}

/**
 * Hook para secuencias de animaciones
 */
export function useSequence(animations) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef(null);

  const playNext = useCallback(() => {
    if (currentIndex >= animations.length - 1) {
      setIsPlaying(false);
      setCurrentIndex(0);
      return;
    }

    const nextAnimation = animations[currentIndex + 1];
    setCurrentIndex(currentIndex + 1);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      playNext();
    }, nextAnimation.duration || 1000);
  }, [currentIndex, animations]);

  const play = useCallback(() => {
    setIsPlaying(true);
    playNext();
  }, [playNext]);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    currentAnimation: animations[currentIndex],
    currentIndex,
    isPlaying,
    play,
    stop
  };
}

/**
 * Hook para eventos de cinemáticas
 */
export function useCinematicEvent(event, callback, dependencies = []) {
  const eventBus = useMemo(() => getGlobalEventBus(), []);

  useEffect(() => {
    const unsubscribe = eventBus.on(event, callback);
    return unsubscribe;
  }, [event, callback, ...dependencies]);
}

/**
 * Hook para sprites animados
 */
export function useSprite(config) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const frameTimeRef = useRef(0);

  const {
    frameCount = 1,
    fps = 24,
    loop = true,
    autoPlay = true
  } = config;

  const [isPlaying, setIsPlaying] = useState(autoPlay);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    frameTimeRef.current += delta;
    const frameInterval = 1 / fps;

    if (frameTimeRef.current >= frameInterval) {
      frameTimeRef.current = 0;

      setCurrentFrame(prev => {
        const next = prev + 1;

        if (next >= frameCount) {
          if (loop) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }

        return next;
      });
    }
  });

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const reset = useCallback(() => {
    setCurrentFrame(0);
    frameTimeRef.current = 0;
  }, []);

  return {
    currentFrame,
    isPlaying,
    play,
    pause,
    reset
  };
}

/**
 * Hook para control de cámara cinemática
 */
export function useCinematicCamera(cameraRef, config) {
  const targetRef = useRef(config.target || { x: 0, y: 0, z: 0 });
  const [mode, setMode] = useState(config.mode || 'fixed');

  useFrame((_, delta) => {
    if (!cameraRef.current) return;

    switch (mode) {
      case 'follow':
        _followTarget(cameraRef.current, targetRef.current, delta);
        break;

      case 'lookAt':
        _lookAtTarget(cameraRef.current, targetRef.current);
        break;

      case 'orbit':
        _orbitTarget(cameraRef.current, targetRef.current, delta);
        break;

      default:
        break;
    }
  });

  const _followTarget = (camera, target, delta) => {
    const smoothing = config.smoothing || 0.1;
    camera.position.x += (target.x - camera.position.x) * smoothing;
    camera.position.y += (target.y - camera.position.y) * smoothing;
    camera.position.z += (target.z - camera.position.z) * smoothing;
  };

  const _lookAtTarget = (camera, target) => {
    camera.lookAt(target.x, target.y, target.z);
  };

  const _orbitTarget = (camera, target, delta) => {
    const radius = config.radius || 5;
    const speed = config.speed || 1;
    const time = performance.now() * 0.001 * speed;

    camera.position.x = target.x + Math.cos(time) * radius;
    camera.position.z = target.z + Math.sin(time) * radius;
    camera.lookAt(target.x, target.y, target.z);
  };

  const setTarget = useCallback((target) => {
    targetRef.current = target;
  }, []);

  return {
    mode,
    setMode,
    target: targetRef.current,
    setTarget
  };
}

/**
 * Hook para precargar assets
 */
export function usePreloadAssets(assets) {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      try {
        const total = Object.keys(assets).length;
        let loadedCount = 0;

        for (const [key, asset] of Object.entries(assets)) {
          if (cancelled) break;

          // Aquí implementaríamos la carga real del asset
          await new Promise(resolve => setTimeout(resolve, 100));

          loadedCount++;
          setProgress(loadedCount / total);
        }

        if (!cancelled) {
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      }
    };

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [assets]);

  return { loaded, progress, error };
}

export default {
  useCinematic,
  useTimeline,
  useSequence,
  useCinematicEvent,
  useSprite,
  useCinematicCamera,
  usePreloadAssets
};
