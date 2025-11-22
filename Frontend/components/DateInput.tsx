import React, { useState } from "react";
import { View, Pressable, Text, Platform, StyleSheet } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import Input from "./Input";

interface DateInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
}

export default function DateInput({
  placeholder,
  value,
  onChangeText,
}: DateInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const getLocalDateFromBackend = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    const cleanDate = dateString.includes("T") 
      ? dateString.split("T")[0] 
      : dateString;

    const [year, month, day] = cleanDate.split("-").map(Number);
    
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  const formatDateToDisplay = (dateString: string): string => {
    if (!dateString) return "";
    const date = getLocalDateFromBackend(dateString);
    
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const year = selectedDate.getFullYear();
      
      const backendFormat = `${year}-${month}-${day}`;
      onChangeText(backendFormat);
    }
  };

  const dateValue = getLocalDateFromBackend(value);

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setShowPicker(true)} style={styles.pressable}>
        <View pointerEvents="none">
          <Input
            placeholder={placeholder}
            value={formatDateToDisplay(value)}
            editable={false}
            onChangeText={() => {}} 
          />
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
  },
  pressable: {
    width: "100%",
  },
});