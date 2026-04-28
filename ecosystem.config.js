module.exports = {
  apps : [{
    name: 'backend',
    script: 'app.py',
    cwd: './backend',
    interpreter: 'python3',
    env: {
      PORT: 5000
    }
  }, {
    name: 'frontend',
    script: 'npm',
    args: 'start',
    cwd: './frontend',
    env: {
      PORT: 3000,
      NEXT_PUBLIC_API_URL: 'http://16.170.141.196:5000'
    }
  }]
};
