const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const getTimestamp = () => {
  return new Date().toLocaleString('es-ES', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const logger = {
  info: (message, ...args) => {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${colors.white}[${getTimestamp()}]${colors.reset} ${message}`, ...args);
  },
  
  success: (message, ...args) => {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${colors.white}[${getTimestamp()}]${colors.reset} ${message}`, ...args);
  },
  
  warning: (message, ...args) => {
    console.warn(`${colors.yellow}[WARNING]${colors.reset} ${colors.white}[${getTimestamp()}]${colors.reset} ${message}`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`${colors.red}[ERROR]${colors.reset} ${colors.white}[${getTimestamp()}]${colors.reset} ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${colors.magenta}[DEBUG]${colors.reset} ${colors.white}[${getTimestamp()}]${colors.reset} ${message}`, ...args);
    }
  }
};

module.exports = logger;