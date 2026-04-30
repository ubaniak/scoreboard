//go:build darwin

package backup

import "github.com/sqweek/dialog"

func pickDirectory() (string, bool, error) {
	dir, err := dialog.Directory().Title("Select Backup Directory").Browse()
	if err == dialog.ErrCancelled {
		return "", true, nil
	}
	if err != nil {
		return "", false, err
	}
	return dir, false, nil
}
