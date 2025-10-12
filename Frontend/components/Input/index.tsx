import React, { useState } from "react";
import { TextInput, TextInputProps } from "react-native";
import { styles } from "@/styles/index";

export default function Input(props: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor="#999"
      autoCapitalize="none"
      {...props}
      style={
        isFocused
          ? [styles.input, styles.inputFocus, props.style]
          : [styles.input, props.style]
      }
      onFocus={(e) => {
        setIsFocused(true);
        props.onFocus && props.onFocus(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        props.onBlur && props.onBlur(e);
      }}
    />
  );
}
