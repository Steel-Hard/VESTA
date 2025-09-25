import mongo from 'mongoose';
import app from './app';

mongo.connect('mongodb://localhost:27017/vesta').then(() => {
  console.log('Connected to database');
});

app.listen(3030, () => {
  console.log('Running at port 3030');
});
