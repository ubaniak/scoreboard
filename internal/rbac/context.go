package rbac

import (
	"context"
)

type contextKey string

var roleKey contextKey = "role"

func getValueFromCtx[T any](ctx context.Context, key contextKey) (T, bool) {
	val := ctx.Value(key)
	if val == nil {
		var zero T
		return zero, false
	}

	typed, ok := val.(T)
	return typed, ok
}

func GetRoleFromCtx(ctx context.Context) (string, bool) {
	return getValueFromCtx[string](ctx, roleKey)
}
