#!/usr/bin/env node

import process from 'node:process';
import {$} from 'execa';
import chalk from 'chalk';
import enquirer from 'enquirer';
import ansi from 'ansi-colors';

await $`git rev-parse --is-inside-work-tree`
	.catch(() => {
		console.error(chalk.red('Oopsie! This does not look like a git repository.'));
		process.exit(1);
	});

console.log();

const {Toggle, MultiSelect} = enquirer;

new Toggle({
	message: 'Show all branches?',
	enabled: 'Yes',
	disabled: 'No, only merged',
})
	.run()
	.then(async (showAll) => {

		const branches = await $`git branch -vv --format %(HEAD)~%(refname:lstrip=2)~%(upstream:track)~%(upstream:lstrip=3)`;

		const branchesData = branches.stdout
			.split('\n')
			.filter(branch => showAll ? showAll : branch.includes('[gone]'))
			.map(branch => {

				const [head, name, track] = branch.split('~');
				const disabledMap = {
					'develop': chalk.red( 'DEFAULT' ),
					'*': chalk.yellow( 'CURRENT' ),
				};

				return {
					name,
					hint: track === '[gone]' && showAll ? chalk.green( 'MERGED' ) : '',
					disabled: disabledMap[name] || disabledMap[head] || false,
				};
			});

			new MultiSelect({
			message: 'Select branches to delete:',
			limit: 1000,
			name: 'value',
			choices: branchesData,
			indicator(state, choice) {
				return choice.enabled
					? chalk.white.bgGreen(' ' + state.symbols.indicator + ' ')
					: chalk.gray.dim(' ' + state.symbols.indicator + ' ');
			}
		}).run()
			.then(answer => {

				console.log();

				if (answer.length === 0) {
					console.log(chalk.yellow('No branches selected.'));
					process.exit(0);
				}

				answer.forEach(async branch => {
					await $`git branch -D ${branch}`;
				});

				const word = answer.length === 1 ? 'branch' : 'branches';

				console.log(chalk.green(`${ansi.symbols.check} Deleted ${answer.length} ${word}.`));

			})
			.catch(console.error);

	})
	.catch(console.error);
