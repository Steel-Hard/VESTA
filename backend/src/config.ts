import dotenv from 'dotenv';

dotenv.config();

const { CLIENT_ID, CLOUDNARY_API_KEY, CLOUDNARY_API_SECRET, CLOUDNARY_NAME } =
  process.env;

if (!CLIENT_ID) {
  throw new Error('Missing environment variables');
}

export const config = {
  CLIENT_ID,
  CLOUDNARY_API_KEY,
  CLOUDNARY_API_SECRET,
  CLOUDNARY_NAME,
};
