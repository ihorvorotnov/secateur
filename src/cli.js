#!/usr/bin/env node

import process from 'node:process';
import {$} from 'execa';
import chalk from 'chalk';
import enquirer from 'enquirer';

await $`git rev-parse --is-inside-work-tree`
	.catch(() => {
		console.error(chalk.red('Oopsie! This does not look like a git repository.'));
		process.exit(1);
	});

const branches = await $`git branch -vv --format %(HEAD)~%(refname:lstrip=2)~%(upstream:track)~%(upstream:lstrip=3)`;

const branchesData = branches.stdout
	.split('\n')
	.map(branch => {
		const [head, name, track, remoteName] = branch.split('~');
		const disabledMap = {
			'develop': 'Default',
			'*': 'Current'
		};

		return {
			name,
			hint: track === '[gone]' ? 'Merged' : '',
			disabled: disabledMap[name] || disabledMap[head] || false,
		};
	});

console.log(branchesData);
