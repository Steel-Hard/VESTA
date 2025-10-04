import dotenv from 'dotenv';

dotenv.config();

const { CLIENT_ID } = process.env;

if (!CLIENT_ID) {
  throw new Error('Missing environment variables');
}

export const config = {
  CLIENT_ID,
};
