package muxutils

import (
	"fmt"
	"reflect"
	"strconv"
)

type Integer interface {
	~int | ~int8 | ~int16 | ~int32 | ~int64 |
		~uint | ~uint8 | ~uint16 | ~uint32 | ~uint64 | ~uintptr
}

func ParseVars[T Integer](vars map[string]string, key string) (T, error) {
	var empty T
	str, ok := vars[key]
	if !ok {
		return empty, fmt.Errorf("key %q not found", key)
	}
	typ := reflect.TypeOf(empty)
	bitSize := typ.Bits()
	kind := typ.Kind()

	var parsedInt int64
	var parsedUint uint64
	var err error

	switch {
	case kind >= reflect.Int && kind <= reflect.Int64:
		parsedInt, err = strconv.ParseInt(str, 10, bitSize)
		if err != nil {
			return empty, err
		}
		return T(parsedInt), nil
	case kind >= reflect.Uint && kind <= reflect.Uint64 || kind == reflect.Uintptr:
		parsedUint, err = strconv.ParseUint(str, 10, bitSize)
		if err != nil {
			return empty, err
		}
		return T(parsedUint), nil
	default:
		// This shouldn't happen due to the constraint, but for safety.
		return empty, fmt.Errorf("unsupported type %T", empty)
	}
}
