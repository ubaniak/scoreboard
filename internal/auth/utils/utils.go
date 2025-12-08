package utils

import (
	"crypto/rand"
	"math/big"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateCode(length int) (string, error) {
	const letters = "0123456789"
	numLetters := big.NewInt(int64(len(letters)))

	result := make([]byte, length)
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, numLetters)
		if err != nil {
			return "", err
		}
		result[i] = letters[n.Int64()]
	}
	return string(result), nil
}

func GenerateJWTToken(role string, sign []byte) (string, error) {
	claims := jwt.MapClaims{
		"role": role,
		"exp":  time.Now().Add(time.Hour * 72).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(sign)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}
