const { spawn } = require("child_process");
const fs = require("fs-extra");
const axios = require("axios");
const uuid = require('uuid');
const totp = require('totp-generator');
const chalk = require('chalk');
const gradient = require('gradient-string');
const logger = require("./utils/log");
const config = require('./config/config.json');
const logacc = require('./config/acc.json');
const logo = `
░██████╗░░█████╗░░░░░░██╗░█████╗░
██╔════╝░██╔══██╗░░░░░██║██╔══██╗
██║░░██╗░██║░░██║░░░░░██║██║░░██║
██║░░╚██╗██║░░██║██╗░░██║██║░░██║
╚██████╔╝╚█████╔╝╚█████╔╝╚█████╔╝
░╚═════╝░░╚════╝░░╚════╝░░╚════╝░`;

// Define the galaxy color scheme
const colors = [
    '#0f0c29', // Deep Blue
    '#302b63', // Indigo
    '#24243e', // Dark Purple
    '#6a0572', // Purple
    '#ff0084', // Pink
    '#f9008e'  // Hot Pink
];

// Apply gradient to each line
const lines = logo.split('\n');
const gradientLogo = lines.map((line, index) => {
    // Cycle through galaxy colors for each line
    const color1 = colors[index % colors.length];
    const color2 = colors[(index + 1) % colors.length];
    return gradient(color1, color2)(line);
}).join('\n');

console.log(gradientLogo);

// Theme configuration
const theme = config.DESIGN.Theme.toLowerCase();
const themes = {
  blue: gradient("#1affa3", "cyan", "pink"),
  dream2: gradient("blue", "pink"),
  dream: gradient("blue", "pink", "gold"),
  test: gradient("#243aff", "#4687f0", "#5800d4"),
  fiery: gradient("#fc2803", "#fc6f03", "#fcba03"),
  rainbow: gradient.rainbow,
  pastel: gradient.pastel,
  cristal: gradient.cristal,
  red: gradient("red", "orange"),
  aqua: gradient("#0030ff", "#4e6cf2"),
  pink: gradient("purple", "pink"),
  retro: gradient.retro,
  sunlight: gradient("orange", "#ffff00", "#ffe600"),
  teen: gradient("#00a9c7", "#853858"),
  summer: gradient("#fcff4d", "#4de1ff"),
  flower: gradient("blue", "purple", "yellow", "#81ff6e"),
  ghost: gradient("#0a658a", "#0a7f8a", "#0db5aa"),
  hacker: chalk.hex('#4be813')
};
const co = themes[theme] || gradient("#243aff", "#4687f0", "#5800d4");

// Check and log packages
fs.readFile('package.json', 'utf8', (err, data) => {
  if (err) return;
  try {
    const { dependencies = {} } = JSON.parse(data);
    logger(`Hiện tại tổng có ${Object.keys(dependencies).length} Package`, '[ PACKAGE ]');
  } catch {}
});

// Check and log modules
try {
  fs.readdirSync('./modules/commands')
    .filter(file => file.endsWith('.js'))
    .forEach(file => require(`./modules/commands/${file}`));
  logger('Tiến Hành Check Lỗi', '[ AUTO-CHECK ]');
  logger('Các Modules Hiện Không Có Lỗi', '[ AUTO-CHECK ]');
} catch (error) {
  logger('Đã Có Lỗi Tại Lệnh:', '[ AUTO-CHECK ]');
  console.log(error);
}

// Start bot
function startBot(message) {
  if (message) logger(message, "[ Bắt đầu ]");

  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Gojo.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true
  });

  child.on("close", (codeExit) => {
    if (codeExit !== 0 && global.countRestart < 5) {
      global.countRestart += 1;
      startBot("Mirai Loading - Tiến Hành Khởi Động Lại");
    }
  });

  child.on("error", (error) => {
    logger(`Đã xảy ra lỗi: ${JSON.stringify(error)}`, "[ Bắt đầu ]");
  });
}

// Facebook login
async function login() {
  if (config.ACCESSTOKEN) return;

  const { EMAIL: email, PASSWORD: password, OTPKEY: otpKey } = logacc;
  if (!email || !password || !otpKey) {
    return console.log('Thiếu thông tin tài khoản');
  }

  const form = {
    adid: uuid.v4(),
    email,
    password,
    format: 'json',
    device_id: uuid.v4(),
    cpl: 'true',
    family_device_id: uuid.v4(),
    locale: 'en_US',
    client_country_code: 'US',
    credentials_type: 'device_based_login_password',
    generate_session_cookies: '1',
    api_key: '882a8490361da98702bf97a021ddc14d',
    access_token: '275254692598279|585aec5b4c27376758abb7ffcb9db2af'
  };

  form.sig = encodesig(sort(form));

  try {
    const { data } = await axios.post('https://b-graph.facebook.com/auth/login', form);
    saveAccessToken(data.access_token, data.session_cookies);
  } catch (error) {
    await handle2FA(error.response.data.error.error_data, form, otpKey);
  }
}

// Handle 2FA
async function handle2FA(data, form, otpKey) {
  form.twofactor_code = totp(otpKey.replace(/\s+/g, '').toLowerCase());
  form.credentials_type = "two_factor";
  form.userid = data.uid;
  form.machine_id = data.machine_id;
  form.first_factor = data.login_first_factor;
  delete form.sig;
  form.sig = encodesig(sort(form));

  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    const { data } = await axios.post('https://b-graph.facebook.com/auth/login', form);
    saveAccessToken(data.access_token, data.session_cookies);
  } catch (error) {
    console.log(error.response.data);
  }
}

// Save access token and session cookies
function saveAccessToken(token, cookies) {
  if (token) {
    config.ACCESSTOKEN = token;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
  }
}

// Helper functions
function encodesig(string) {
  return md5(Object.keys(string).sort().map(key => `${key}=${string[key]}`).join('') + '62f8ce9f74b12f84c123cc23437a4a32');
}

function md5(string) {
  return require('crypto').createHash('md5').update(string).digest('hex');
}

function sort(obj) {
  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}

// Start bot if access token exists, else login
(async function startb() {
  if (config.ACCESSTOKEN) {
    startBot();
  } else {
    await login();
    setTimeout(startBot, 7000);
  }
})();