require('dotenv').config();
require('ts-node/register');
require('./src/db/seed.ts').seed();
