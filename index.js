#!/usr/bin/env node

const chalk       = require('chalk');
const figlet      = require('figlet');

const github       = require('./lib/github');
const files        = require('./lib/files');

// console.log(
//   chalk.yellow(
//     figlet.textSync('Github helpers', { horizontalLayout: 'full' })
//   )
// );

if (files.directoryExists('.git')) {
  const getGithubToken = async () => {
    // Fetch token from config store
    let token = github.getStoredGithubToken();
    if(token) {
      return token;
    }
  
    // No token found, use credentials to access github account
    await github.setGithubCredentials();
  
    // Check if access token for ginit was registered
    const accessToken = await github.hasAccessToken();
    if(accessToken) {
      console.log(chalk.yellow('An existing access token has been found!'));
      // ask user to regenerate a new token
      token = await github.regenerateNewToken(accessToken.id);
      return token;
    }
  
    // No access token found, register one now
    token = await github.registerNewToken();
    return token;
  }
  
  
  const run = async () => {
    try {
      // Retrieve & Set Authentication Token
      const token = await getGithubToken();
      github.githubAuth(token);
      
      let showPullRequests = process.argv.length === 0;
      let showBranches = process.argv.length === 0;
      
      process.argv.forEach(function (val, index, array) {
        showPullRequests = val.includes('p');
        showBranches = val.includes('b');
      });

      if (showPullRequests) {
        // Use octokit for requests
        console.log('Pull requests : ');
        await github.getPullRequests({
          owner: 'Witchbird',
          repo: 'Negotiation-App',
          state: 'open'
        });
      }

      if (showBranches) {
        console.log('Remote branches : ');
        await github.getMyRemoteBranches({
          owner: 'Witchbird',
          repo: 'Negotiation-App'
        });
      }
    } catch(err) {
        if (err) {
          switch (err.code) {
            case 401:
              console.log(chalk.red('Couldn\'t log you in. Please provide correct credentials/token.'));
              break;
            default:
              console.log(err);
          }
        }
        console.log(chalk.red('Unexpected error !'));
        process.exit();
    }
  }
  
  run();
} else {
  console.log(chalk.red('Not a git repository !'));
  process.exit();
}
