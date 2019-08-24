# Github_helpers

This is an npm package that allows you to list your remote branches/pull requests from the command line in your github projects. It uses the github API through the npm package octokit to authenticate you and fetch data.

## Usage

After installation you should be able to run the command `gith` in your github project folder. If you use gith -p you'll get the list of pull request along with a label stating if the pull request is up to date.

If the pull request is outdated (means the branch you were rebased on moved) you'll get an `OLD` label next to the PR instead of `OK`.

## Installation

1. Clone the repo on your system
2. Go to the project root using your terminal and enter `npm install`
3. Use `npm pack` to build and package the program in your system
4. Enter `npm install -g github_helpers` to install the program globally on your system