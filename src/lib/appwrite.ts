import { Client, Account, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69b373670029695dae96');

export const account = new Account(client);
export const databases = new Databases(client);
export { client };

export const DATABASE_ID = '69b3778a0006292b8708';
export const COLLECTION_ID = 'users';
