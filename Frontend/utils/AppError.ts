export class AppError {
    message: string;
    error?: string;
    constructor(message: string){
        this.message = message;
    }
}