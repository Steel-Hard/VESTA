declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    JWT_SECRET: string;
    HOST: string;
    USER: string;
    PASS: string;
    DB: string;
    CLIENT_ID: string;
    CLOUDNARY_NAME: string;
    CLOUDNARY_API_KEY: string;
    CLOUDNARY_API_SECRET: string;
  }
}
