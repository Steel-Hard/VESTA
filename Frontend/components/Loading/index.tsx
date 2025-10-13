import { ActivityIndicator } from "react-native";
import  Container from "@/components/Container";



export default function Loading(){
    return(
        <Container >
            <ActivityIndicator color={"#fff"}/>
        </Container>
    );
}