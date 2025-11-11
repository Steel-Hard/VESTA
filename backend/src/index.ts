import mongo from 'mongoose';
import app from './app';
import { config } from './config';

const URI = config.MONGODB_URI || 'mongodb://localhost:27017/vesta'

mongo.connect(URI, { serverSelectionTimeoutMS: 30000 })
    .then(() => console.log("mongodb conectado"))
    .catch((error) => {throw Error("Erro ao conectar ao mongodb: " + error)})

app.listen(3030, () => {
  console.log('Running at port 3030');
});
