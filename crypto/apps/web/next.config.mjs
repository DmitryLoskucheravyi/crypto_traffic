import nextEnv from '@next/env';
import path from 'path';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(path.resolve(process.cwd(), '..', '..'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
