const Octokit     = require('@octokit/rest');
const Configstore = require('configstore');
const pkg         = require('../package.json');
const _           = require('lodash');
const CLI         = require('clui');
const Spinner     = CLI.Spinner;
const chalk       = require('chalk');

const inquirer    = require('./inquirer');

const conf = new Configstore(pkg.name);

let octokit;

module.exports = {

  setGithubCredentials : async () => {
    const credentials = await inquirer.askGithubCredentials();
    octokit = new Octokit({
      auth: {
        username: credentials.username,
        password: credentials.password,
        on2fa() {
          return credentials.twofa;
        }
      }
    });
  },

  registerNewToken : async () => {
    const status = new Spinner('Authenticating you, please wait...');
    status.start();

    try {
      const response = await octokit.oauthAuthorizations.createAuthorization({
        scopes: ['user', 'public_repo', 'repo', 'repo:status'],
        note: 'Github helpers'
      });
      const token = response.data.token;
      if(token) {
        conf.set('github.token', token);
        return token;
      } else {
        throw new Error("Missing Token","Github token was not found in the response");
      }
    } catch (err) {
      throw err;
    } finally {
      status.stop();
    }
  },

  githubAuth : async (token) => {
    octokit = new Octokit({
      auth: `token ${token}`
    });
  },

  getStoredGithubToken : () => {
    return conf.get('github.token');
  },

  hasAccessToken : async () => {
    const status = new Spinner('Authenticating you, please wait...');
    status.start();

    try {
      const response = await octokit.authorization.listGrants();
      const accessToken = _.find(response.data, (row) => {
        if(row.note) {
          return row.note.indexOf('ginit') !== -1;
        }
      });
      return accessToken;
    } catch (err) {
      throw err;
    } finally {
      status.stop();
    }
  },

  regenerateNewToken : async (id) => {
    const tokenUrl = 'https://github.com/settings/tokens/' + id;
    console.log('Please visit ' + chalk.underline.blue.bold(tokenUrl) + ' and click the ' + chalk.red.bold('Regenerate Token Button.\n'));
    const input = await inquirer.askRegeneratedToken();
    if(input) {
      conf.set('github.token', input.token);
      return input.token;
    }
  },

  getPullRequests : async (params) => {
    try {
      let { data } = await octokit.pulls.list(params);
      
      let res = await data.filter((p) => p.user.login === 'david-ratier').map(async (p) => {
        return {
          title: p.title,
          branch: p.head.ref,
          head: p.head.sha,
          base: p.base.sha,
          base_branch: await octokit.repos.getBranch({ 
            owner: params.owner,
            repo: params.repo,
            branch: p.base.ref
          })
        }
      });
      
      Promise.all(res).then((d) => {
        let result = d.map((o) => {
          return {
            title: o.title,
            branch: o.branch,
            head: o.head,
            target_base: o.base,
            current_base: o.base_branch.data.commit.sha,
            outdated: o.base !== o.base_branch.data.commit.sha,
            based_on: d.filter((o2) => {
              o.base_branch.data.commit.sha === o2.head;
            })
          }
        }).filter((o) => {
          return o.based_on.length === 0;
        });
        result.forEach((pr) => {
          let message = '';
          if (pr.outdated) {
            message += pr.title + chalk.red(' OLD');
          } else {
            message += pr.title + chalk.green(' OK');
          }
          pr.based_on.forEach((base) => {
            message += ' ' + base;
          });
          console.log(message);
        });
      });
    }
    catch(err) {
      if (err) {
        console.log(err);
      } else {
        console.log(chalk.red('Unexpected error when trying to get pull requests'));
      }
      process.exit();
    }
  }

};
