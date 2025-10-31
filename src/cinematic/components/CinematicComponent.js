/**
 * COMPONENTES DECLARATIVOS - Componentes React para cinemáticas
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable, Text } from 'react-native';
import { useCinematic, useTimeline, useSprite } from '../hooks/useCinematic';
import { CinematicState } from '../types';

/**
 * Componente Cinematic - Contenedor principal
 */
export function Cinematic({
  config,
  children,
  onStart,
  onComplete,
  showControls = false,
  autoPlay = true
}) {
  const cinematicState = useCinematic({
    ...config,
    autoPlay,
    onStart,
    onComplete
  });

  return (
    <View style={styles.cinematicContainer}>
      {children}

      {showControls && (
        <CinematicControls {...cinematicState} />
      )}

      {cinematicState.state === CinematicState.LOADING && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Controles de cinemática
 */
function CinematicControls({ play, pause, stop, skip, isPlaying, isPaused, progress }) {
  return (
    <View style={styles.controls}>
      <Pressable onPress={isPlaying ? pause : play} style={styles.button}>
        <Text style={styles.buttonText}>{isPlaying ? 'Pause' : 'Play'}</Text>
      </Pressable>

      <Pressable onPress={stop} style={styles.button}>
        <Text style={styles.buttonText}>Stop</Text>
      </Pressable>

      {isPaused && (
        <Pressable onPress={skip} style={styles.button}>
          <Text style={styles.buttonText}>Skip</Text>
        </Pressable>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

/**
 * Componente Timeline - Secuenciador declarativo
 */
export function TimelineComponent({
  config,
  children,
  autoPlay = true
}) {
  const timeline = useTimeline({
    ...config,
    autoPlay
  });

  return (
    <View style={styles.timelineContainer}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            timeline: timeline.timeline,
            currentTime: timeline.currentTime
          });
        }
        return child;
      })}
    </View>
  );
}

/**
 * Componente Keyframe - Define un punto clave
 */
export function Keyframe({
  time,
  values,
  easing = 'linear',
  onReach,
  children,
  timeline,
  currentTime
}) {
  const isActive = currentTime >= time;

  useEffect(() => {
    if (isActive && onReach) {
      onReach();
    }
  }, [isActive, onReach]);

  return (
    <View style={[styles.keyframe, isActive && styles.keyframeActive]}>
      {children}
    </View>
  );
}

/**
 * Componente Sprite - Sprite animado
 */
export function SpriteComponent({
  source,
  frameWidth,
  frameHeight,
  frameCount = 1,
  fps = 24,
  loop = true,
  autoPlay = true,
  style
}) {
  const sprite = useSprite({
    frameCount,
    fps,
    loop,
    autoPlay
  });

  const animatedStyle = useMemo(() => {
    const offsetX = -(sprite.currentFrame * frameWidth);
    return {
      transform: [{ translateX: offsetX }]
    };
  }, [sprite.currentFrame, frameWidth]);

  return (
    <View style={[styles.spriteContainer, { width: frameWidth, height: frameHeight }, style]}>
      <Animated.Image
        source={source}
        style={[
          styles.spriteSheet,
          { width: frameWidth * frameCount, height: frameHeight },
          animatedStyle
        ]}
      />
    </View>
  );
}

/**
 * Componente AnimatedValue - Anima un valor
 */
export function AnimatedValue({
  from,
  to,
  duration = 1000,
  easing = 'linear',
  delay = 0,
  children
}) {
  const animatedValue = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: to,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, [from, to, duration, delay]);

  return children(animatedValue);
}

/**
 * Componente Sequence - Secuencia de animaciones
 */
export function Sequence({ children, autoPlay = true }) {
  const childrenArray = React.Children.toArray(children);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    if (autoPlay && currentIndex < childrenArray.length) {
      const timer = setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 1000); // Duración por defecto

      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPlay, childrenArray.length]);

  const currentChild = childrenArray[currentIndex];

  return (
    <View style={styles.sequence}>
      {currentChild}
    </View>
  );
}

/**
 * Componente Parallel - Animaciones en paralelo
 */
export function Parallel({ children }) {
  return (
    <View style={styles.parallel}>
      {children}
    </View>
  );
}

/**
 * Componente FadeIn - Efecto de fade in
 */
export function FadeIn({
  duration = 500,
  delay = 0,
  children
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

/**
 * Componente FadeOut - Efecto de fade out
 */
export function FadeOut({
  duration = 500,
  delay = 0,
  children
}) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
}

/**
 * Componente SlideIn - Deslizamiento
 */
export function SlideIn({
  from = 'left',
  distance = 300,
  duration = 500,
  delay = 0,
  children
}) {
  const translateX = useRef(new Animated.Value(
    from === 'left' ? -distance : from === 'right' ? distance : 0
  )).current;

  const translateY = useRef(new Animated.Value(
    from === 'top' ? -distance : from === 'bottom' ? distance : 0
  )).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
      {children}
    </Animated.View>
  );
}

/**
 * Componente Scale - Escala
 */
export function Scale({
  from = 0,
  to = 1,
  duration = 500,
  delay = 0,
  children
}) {
  const scale = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: to,
      duration,
      delay,
      useNativeDriver: true
    }).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
}

/**
 * Componente Rotate - Rotación
 */
export function Rotate({
  from = 0,
  to = 360,
  duration = 1000,
  delay = 0,
  loop = false,
  children
}) {
  const rotation = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    const animation = Animated.timing(rotation, {
      toValue: to,
      duration,
      delay,
      useNativeDriver: true
    });

    if (loop) {
      Animated.loop(animation).start();
    } else {
      animation.start();
    }
  }, []);

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
      {children}
    </Animated.View>
  );
}

/**
 * Componente CinematicOverlay - Overlay para cinemáticas
 */
export function CinematicOverlay({
  visible,
  onDismiss,
  skippable = true,
  children
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {children}

      {skippable && (
        <Pressable
          style={styles.skipButton}
          onPress={onDismiss}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cinematicContainer: {
    flex: 1,
    position: 'relative'
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    fontSize: 18
  },
  timelineContainer: {
    flex: 1
  },
  keyframe: {
    opacity: 0.5
  },
  keyframeActive: {
    opacity: 1
  },
  spriteContainer: {
    overflow: 'hidden'
  },
  spriteSheet: {
    resizeMode: 'stretch'
  },
  sequence: {
    flex: 1
  },
  parallel: {
    flex: 1
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 5
  },
  skipButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default {
  Cinematic,
  TimelineComponent,
  Keyframe,
  SpriteComponent,
  AnimatedValue,
  Sequence,
  Parallel,
  FadeIn,
  FadeOut,
  SlideIn,
  Scale,
  Rotate,
  CinematicOverlay
};
