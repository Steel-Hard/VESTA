import { View } from "react-native";
import {styles} from "@/styles/index"

interface IReactProps {
    children: React.ReactNode
}


export default function Container({children}: IReactProps){
    return(
    <View style={styles.container}>
        {children}
    </View>
    )
}