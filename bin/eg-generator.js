const Generator = require('yeoman-generator');
const config = require('../lib/config');

module.exports = class EgGenerator extends Generator {
  constructor (args, opts) {
    super(args, opts);

    this._configuration = null;
    this.eg = this.env.eg;
    this.argv = this.env.argv;
    this.admin = require('../admin')({
      baseUrl: this._getAdminClientBaseURL(),
      verbose: this._getAdminClientVerboseFlag(),
      headers: this.argv ? this.argv.H : null
    });
  }

  configureCommand (configuration) {
    const builder = configuration.builder;
    configuration.builder = yargs => {
      return this._wrapConfig(builder(yargs));
    };

    configuration.handler = argv => {
      this.env.argv = argv;

      const command = this.options.env.commandAliases[0][argv._[0]];
      const subCommand = this.options.env.commandAliases[1][command][argv._[1]];

      this.env.run(`express-gateway:${command}:${subCommand}`);
    };

    this._configuration = configuration;
  }

  stdout (...args) {
    // eslint-disable-next-line no-console
    console.log.apply(console, args);
  }

  createSubCommand (name) {
    const generatorName = `${this.constructor.namespace}:${name}`;
    return this.env.create(generatorName)._configuration;
  }

  // configuration defaults
  _wrapConfig (yargs) {
    return yargs
      .boolean(['q', 'v'])
      .string(['H'])
      .alias('q', 'quiet')
      .describe('q', 'Only show major pieces of output')
      .describe('H', 'Header to send with each request to Express Gateway Admin API KEY:VALUE format')
      .alias('v', 'verbose')
      .describe('v', 'Verbose output, will show request to Admin API')
      .group(['q'], 'Options:')
      .help('h');
  }

  _getAdminClientBaseURL () {
    const gatewayConfig = config.gatewayConfig;
    const systemConfig = config.systemConfig;

    let baseURL = 'http://localhost:9876/'; // fallback default

    if (process.env.EG_ADMIN_URL) {
      baseURL = process.env.EG_ADMIN_URL;
    } else if (systemConfig && systemConfig.cli && systemConfig.cli.url) {
      baseURL = systemConfig.cli.url;
    } else if (gatewayConfig && gatewayConfig.admin) {
      const adminConfig = gatewayConfig.admin;
      const hostname = adminConfig.hostname || 'localhost';
      const port = adminConfig.port || 9876;

      baseURL = `http://${hostname}:${port}/`;
    }

    return baseURL;
  }

  _getAdminClientVerboseFlag () {
    let verbose = false; // default

    if (this.argv && this.argv.v) {
      verbose = this.argv.v;
    } else if (config.systemConfig && config.systemConfig.cli) {
      verbose = !!config.systemConfig.cli.verbose;
    }

    return verbose;
  }
};
