#!/usr/bin/env node
import { Command } from 'commander'
import chalk from 'chalk'
import { initializeProject } from './generators/init.generator'
import { generateModule } from './generators/module.generator'

const program = new Command()

program
    .version('1.0.0')
    .description('Elysia.js project generator')

program
    .command('init <projectName>')
    .description('Initialize new Elysia.js project')
    .action(async (projectName: string) => {
        try {
            await initializeProject(projectName)
        } catch (error) {
            console.error(chalk.red('Error:', error))
        }
    })

program
    .command('generate:module <name>')
    .description('Generate a new module')
    .action(async (name: string) => {
        try {
            await generateModule(name.toLowerCase())
        } catch (error) {
            console.error(chalk.red('Error:', error))
        }
    })

program.parse(process.argv)