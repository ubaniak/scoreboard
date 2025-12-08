package rbac

import (
	"context"
	"net/http"

	"github.com/ubaniak/scoreboard/internal/auth"
)

type RbacService struct {
	roles       *Role
	authUseCase auth.UseCase
}

func NewRbacService(roles *Role, authUseCase auth.UseCase) *RbacService {
	return &RbacService{
		roles:       roles,
		authUseCase: authUseCase,
	}
}

func (s *RbacService) JWTMiddleware(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || len(authHeader) < 7 || authHeader[:7] != "Bearer " {
				http.Error(w, "Missing or invalid token", http.StatusUnauthorized)
				return
			}

			tokenString := authHeader[7:]
			profile, err := s.authUseCase.GetProfile(tokenString)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}
			matched := false
			for _, role := range roles {
				if s.roles.Match(profile.Role, role) {
					matched = true
					break
				}
			}

			if !matched {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			ctx := context.WithValue(r.Context(), roleKey, profile.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
