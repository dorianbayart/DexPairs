module.exports = {
  apps : [{
    name: 'DexPairs_Back',
    script: 'back.js',
    exp_backoff_restart_delay: 100,
    env_production: {
      NODE_ENV: "production",
      PORT: 3000,
    }
  }, {
    name: 'DexPairs_Front',
    script: 'front.js',
    exp_backoff_restart_delay: 100,
    instances: 1,
    exec_mode: "cluster",
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
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 startOrReload ecosystem.config.js --env production',
      'pre-setup': 'pm2 install pm2-logrotate',
      env_production: {
        NODE_ENV: "production"
      }
    }
  }
};
