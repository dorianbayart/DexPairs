module.exports = {
  apps : [{
    name: 'DexPairs - Back',
    script: 'back.js',
    watch: 'back.js',
    //ignore_watch : ["node_modules", "file"]
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
    }
  }, {
    name: 'DexPairs - Front',
    script: 'front.js',
    watch: 'front.js',
    //ignore_watch : ["node_modules", "file"],
    //instances: 1,
    //exec_mode: "cluster",
    //increment_var : 'PORT',
    env_production: {
      NODE_ENV: "production",
      PORT: 3001,
    }
  }],

  deploy : {
    production : {
      user : 'dexpairs',
      host : '185.212.226.82',
      ref  : 'origin/main',
      repo : 'git@github.com:dorianbayart/DexPairs.git',
      path : '/home/dexpairs/prod',
      'pre-deploy-local': 'pwd && ls -al',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --env production && pm2 save',
      'pre-setup': '',
      env_production: {
        NODE_ENV: "production"
      }
    }
  }
};
