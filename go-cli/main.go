package main

import (
	"fmt"
	"os"

	"github.com/Jorlex27/go-cli/cmd"
)

func main() {
	if err := cmd.RootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}