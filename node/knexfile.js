require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host : process.env.POSTGRES_HOST_DEV,
      port : process.env.POSTGRES_PORT_DEV,
      user:     process.env.POSTGRES_USER_DEV,
      password: process.env.POSTGRES_PASSWORD_DEV
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
    seeds: {
      directory: __dirname + '/knex/seeds'
    }
  },
  QA: {
    client: 'postgresql',
    connection: {
      host : process.env.POSTGRES_HOST_QA,
      port : process.env.POSTGRES_PORT_QA,
      user:     process.env.POSTGRES_USER_QA,
      password: process.env.POSTGRES_PASSWORD_QA
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
    seeds: {
      directory: __dirname + '/knex/seeds'
    }
  },
  homolog: {
    client: 'postgresql',
    connection: {
      host : process.env.POSTGRES_HOST_HOMOLOG,
      port : process.env.POSTGRES_PORT_HOMOLOG,
      user:     process.env.POSTGRES_USER_HOMOLOG,
      password: process.env.POSTGRES_PASSWORD_HOMOLOG
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: __dirname + '/knex/migrations',
    },
    seeds: {
      directory: __dirname + '/knex/seeds'
    } 
  }
  };