import React from 'react';
import { View, Text } from 'react-native';

export const FormControl: React.FC<any> = ({ children }) => <View>{children}</View>;
export const FormControlLabel: React.FC<any> = ({ children }) => <View>{children}</View>;
export const FormControlError: React.FC<any> = ({ children }) => <View>{children}</View>;
export const FormControlErrorText: React.FC<any> = ({ children }) => <Text>{children}</Text>;
export const FormControlErrorIcon: React.FC<any> = ({ as: Icon }) => Icon ? <Icon /> : null;
export const FormControlHelper: React.FC<any> = ({ children }) => <View>{children}</View>;
export const FormControlHelperText: React.FC<any> = ({ children }) => <Text>{children}</Text>;
export const FormControlLabelText: React.FC<any> = ({ children }) => <Text>{children}</Text>;

export default FormControl;
