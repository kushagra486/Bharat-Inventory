import { Client, Account, Databases, ID, Query, Permission, Role } from 'react-native-appwrite';

export const APPWRITE_DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;

export const COLLECTIONS = {
  categories: 'categories',
  suppliers: 'suppliers',
  products: 'products',
  notificationSettings: 'notification_settings',
  notificationLogs: 'notification_logs',
  userProfiles: 'user_profiles',
} as const;

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform('com.expirydashboard.app');

export const account = new Account(client);
export const databases = new Databases(client);

export { ID, Query, Permission, Role };
export default client;
