//go:build !darwin

package backup

import "errors"

func pickDirectory() (string, bool, error) {
	return "", false, errors.New("native folder picker not supported on this platform")
}
