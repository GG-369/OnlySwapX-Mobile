import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  // En móviles no hay "hover", solo usamos un estado temporal mientras el dedo presiona
  const [pressedStar, setPressedStar] = useState<number>(0);
  const fontSize = sizeMap[size];

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((n) => {
        // Determinamos si la estrella debe pintarse de amarillo
        const isHighlighted = (pressedStar || value) >= n;

        return (
          <Pressable
            key={n}
            disabled={readonly}
            // Cuando el usuario toca la estrella
            onPressIn={() => !readonly && setPressedStar(n)}
            // Cuando el usuario levanta el dedo
            onPressOut={() => !readonly && setPressedStar(0)}
            // Cuando la acción se completa
            onPress={() => !readonly && onChange?.(n)}
            style={({ pressed }) => [
              styles.starContainer,
              !readonly && pressed && styles.starPressed
            ]}
          >
            <Text
              style={[
                styles.starText,
                { fontSize },
                isHighlighted ? styles.activeColor : styles.inactiveColor,
              ]}
            >
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  starContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  starPressed: {
    transform: [{ scale: 1.1 }], // Pequeño efecto visual al presionar
  },
  starText: {
    lineHeight: 36, // Ajuste para que el texto no se recorte por arriba/abajo
    textAlignVertical: 'center',
  },
  activeColor: {
    color: '#facc15', // yellow-400
  },
  inactiveColor: {
    color: 'rgba(51, 65, 85, 0.6)', // border/60
  }
});