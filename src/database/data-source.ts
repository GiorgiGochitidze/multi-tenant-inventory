import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const useSsl = process.env.DB_SSL === 'true';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
