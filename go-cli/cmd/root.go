package cmd

import (
	"github.com/spf13/cobra"
)

// RootCmd represents the base command when called without any subcommands
var RootCmd = &cobra.Command{
	Use:   "go-cli",
	Short: "A CLI tool for generating Go web application with MongoDB",
	Long: `A CLI tool to initialize and generate modules for Go web applications
with MongoDB integration. This tool helps create controllers, services,
routes, and models based on predefined templates.`,
}

func init() {
	// Add subcommands
	RootCmd.AddCommand(InitCmd)
	RootCmd.AddCommand(GenerateCmd)
}