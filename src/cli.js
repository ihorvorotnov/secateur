#!/usr/bin/env node

import process from 'node:process';
import {$} from 'execa';
import chalk from 'chalk';
import enquirer from 'enquirer';

await $`git rev-parse --is-inside-work-tree`
	.catch(error => {
		console.error(chalk.red('Oopsie! This does not look like a git repository.'));
		process.exit(1);
	});
