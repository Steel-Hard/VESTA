import { Image as ExpoImage } from "expo-image";

type IImageProps = {
  size: number;
  radius?: number;
  src?: string;
  alt?: string;
};

export function UserPhoto({ size, radius, src, alt, ...rest }: IImageProps) {
  return (
    <ExpoImage
      source={src ? src : "https://github.com/claudsaints.png"}
      alt={alt ? alt : "image"}
      style={{
        borderRadius: radius ? radius : 24,
        backgroundColor: "#fff",
        width: size,
        height: size,
      }}
      {...rest}
    />
  );
}
