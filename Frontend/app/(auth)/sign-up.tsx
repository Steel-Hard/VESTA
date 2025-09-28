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
import { AlertCircleIcon, AddIcon, RemoveIcon } from '@/components/ui/icon';
import { Input, InputField,  } from '@/components/ui/input';
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import { Link } from 'expo-router';


export default function SignUp() {
  // const [email, setEmail] = useState("");
  // const [name, setName] = useState("");
  // const [password, setPassword] = useState("");

  const handleSignUp = async () => {

  };

return (
  <ScrollView contentInsetAdjustmentBehavior="automatic">
    <VStack>
      <FormControl
      // isInvalid={isInvalid}
        size="lg"
        isDisabled={false}
        isReadOnly={false}
        isRequired={true}
      >
        <FormControlLabel>
          <FormControlLabelText>Registro</FormControlLabelText>
        </FormControlLabel>
        <Input className="my-1" size="lg">
          <InputField
            type="text"
            placeholder="Nome"
          />
        </Input>
        <Input className="my-1" size="lg">
          <InputField
            type="text"
            placeholder="E-mail"
          />
        </Input>
        <Input className="my-1" size="lg">
          <InputField
            type="password"
            placeholder="password"
            // value={inputValue}
            // onChangeText={(text) => setInputValue(text)}
          />
        </Input>
        <FormControlHelper>
          <FormControlHelperText>
            Mínimo 6 caracteres.
          </FormControlHelperText>
        </FormControlHelper>
        <FormControlError>
          <FormControlErrorIcon as={AlertCircleIcon} className="text-red-500" />
          <FormControlErrorText className="text-red-500">
            Ao menos 6 caracteres.
          </FormControlErrorText>
        </FormControlError>
      </FormControl>
      <Button
        className="w-fit self-center mt-4"
        size="sm"
        variant="outline"
        onPress={handleSignUp}
      >
        <ButtonText>Criar</ButtonText>
      </Button>
      <Button
        className="w-fit self-center mt-10"
        size="sm"
        variant="outline"
      >
        <ButtonText>
          <Link href="/sign-in">
            Entrar na conta
          </Link>
          </ButtonText>
          <ButtonIcon as={RemoveIcon}/>
      </Button>
    </VStack>
    </ScrollView>
  );
}