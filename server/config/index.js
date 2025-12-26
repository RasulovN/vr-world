const config = {
  development: {
    corsOrigins: ["http://localhost:5000", "https://vr-world-bay.vercel.app/"],
    port: process.env.PORT || 3333,
  },
  production: {
    corsOrigins: ["https://vr-world-bay.vercel.app/"],
    port: process.env.PORT || 3333,
  }
};

const env = process.env.NODE_ENV || 'development';
module.exports = config[env];