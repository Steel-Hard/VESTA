import { useState } from "react";
import {
  TextInput,
  ScrollView,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import {
  FormControl,
  FormControlLabel,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { AlertCircleIcon, AddIcon } from '@/components/ui/icon';
import { Input, InputField,  } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Link } from 'expo-router';


export default function SignUp() {
  // const [email, setEmail] = useState("");
  // const [name, setName] = useState("");
  // const [password, setPassword] = useState("");

  const handleSignIn = async () => {

  };

return (
  <ScrollView contentInsetAdjustmentBehavior="automatic">
    <VStack>
      <FormControl
      // isInvalid={isInvalid}
        size="lg"
        isDisabled={false}
        isReadOnly={false}
      >
        <FormControlLabel>
          <FormControlLabelText>Entre com sua conta</FormControlLabelText>
        </FormControlLabel>
        <Input className="my-1" size="lg">
          <InputField
            type="text"
            placeholder="E-mail"
          />
        </Input>
        <Input className="my-1" size="lg">
          <InputField
            type="password"
            placeholder="Senha"
            // value={inputValue}
            // onChangeText={(text) => setInputValue(text)}
          />
        </Input>
        <FormControlHelper>
        </FormControlHelper>
        <FormControlError>
          <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
          <FormControlErrorText className="text-red-500">
           Verifique os caracteres digitados.
          </FormControlErrorText>
        </FormControlError>
      </FormControl>
      <Button
        className="w-fit self-center mt-4"
        size="sm"
        variant="outline"
        onPress={handleSignIn}
      >
        <ButtonText>Logar</ButtonText>
      </Button>
      <Button
        className="w-fit self-center mt-10"
        size="sm"
        variant="outline"
      >
        <ButtonText>
          <Link href="/sign-up">
            Criar conta
          </Link>
          </ButtonText>
          <ButtonIcon as={AddIcon}/>
      </Button>
    </VStack>
    </ScrollView>
  );
}