import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { createServer } from 'http';
import { getConfig, setConfig, isConfigured } from './config.js';
import { getConnections, deleteConnection, exchangeCodeForTokens } from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Not configured.');
    console.log(chalk.cyan('  xerocomxeroidentity config set --client-id <id> --client-secret <secret>'));
    process.exit(1);
  }
}

program
  .name('xerocomxeroidentity')
  .description(chalk.bold('Xero Identity CLI') + ' - OAuth 2.0 identity management')
  .version('1.0.0');

const configCmd = program.command('config').description('Manage configuration');

configCmd
  .command('set')
  .description('Set credentials')
  .option('--client-id <id>', 'Client ID')
  .option('--client-secret <secret>', 'Client Secret')
  .action((options) => {
    if (options.clientId) {
      setConfig('clientId', options.clientId);
      printSuccess(`Client ID set`);
    }
    if (options.clientSecret) {
      setConfig('clientSecret', options.clientSecret);
      printSuccess(`Client Secret set`);
    }
  });

configCmd
  .command('show')
  .description('Show configuration')
  .action(() => {
    const clientId = getConfig('clientId');
    const clientSecret = getConfig('clientSecret');
    const hasToken = !!getConfig('accessToken');

    console.log(chalk.bold('\nXero Identity CLI Configuration\n'));
    console.log('Client ID:     ', clientId ? chalk.green(clientId) : chalk.red('not set'));
    console.log('Client Secret: ', clientSecret ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('Access Token:  ', hasToken ? chalk.green('set') : chalk.red('not set'));
  });

const authCmd = program.command('auth').description('Manage authentication');

authCmd
  .command('login')
  .description('Authenticate with Xero OAuth 2.0')
  .option('--port <port>', 'Callback port', '8765')
  .action(async (options) => {
    if (!isConfigured()) {
      printError('Please configure credentials first.');
      process.exit(1);
    }

    const clientId = getConfig('clientId');
    const port = parseInt(options.port);
    const redirectUri = `http://localhost:${port}/callback`;

    const authUrl = new URL('https://login.xero.com/identity/connect/authorize');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'offline_access openid profile email');

    console.log(chalk.bold('\nXero OAuth 2.0 Login\n'));
    console.log('Open this URL:\n');
    console.log(chalk.cyan(authUrl.toString()));
    console.log('\nWaiting for callback...\n');

    await new Promise((resolve, reject) => {
      const server = createServer(async (req, res) => {
        const url = new URL(req.url, `http://localhost:${port}`);
        if (url.pathname === '/callback') {
          const code = url.searchParams.get('code');
          if (!code) {
            res.end('<h1>Failed</h1>');
            server.close();
            reject(new Error('No code'));
            return;
          }

          try {
            await exchangeCodeForTokens(code, redirectUri);
            res.end('<h1>Success!</h1><p>You can close this tab.</p>');
            server.close();
            printSuccess('Authenticated');
            resolve();
          } catch (err) {
            res.end('<h1>Failed</h1>');
            server.close();
            reject(err);
          }
        }
      });
      server.listen(port);
    });
  });

const connectionsCmd = program.command('connections').description('Manage connections');

connectionsCmd
  .command('list')
  .description('List connections')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching connections...', () => getConnections());
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold('\nConnections\n'));
        data.forEach(c => {
          console.log(`${c.tenantId}  ${chalk.bold(c.tenantName)}  ${c.tenantType}`);
        });
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

connectionsCmd
  .command('delete <connection-id>')
  .description('Delete a connection')
  .action(async (connectionId) => {
    requireAuth();
    try {
      await withSpinner('Deleting connection...', () => deleteConnection(connectionId));
      printSuccess(`Connection ${connectionId} deleted`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
