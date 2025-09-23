declare namespace NodeJS{
    interface ProcessEnv{
        PORT: string;
        JWT_SECRET:string;
        HOST: string;
        USER: string;
        PASS: string;
        DB: string;
    }
}