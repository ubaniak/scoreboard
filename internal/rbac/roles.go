package rbac

import "slices"

type Role struct {
	roles map[string][]string
}

func NewRole() *Role {
	return &Role{
		roles: make(map[string][]string),
	}
}

func (r *Role) AddRole(name string) {
	if _, exists := r.roles[name]; !exists {
		r.roles[name] = []string{}
	}
}

func (r *Role) Inherits(role string, i ...string) {
	if _, exists := r.roles[role]; !exists {
		r.roles[role] = []string{}
	}
	r.roles[role] = append(r.roles[role], i...)
}

func (r *Role) Match(role, toMatch string) bool {
	if role == toMatch {
		return true
	}

	if inherits, exists := r.roles[role]; exists {
		return slices.Contains(inherits, toMatch)
	}

	return false
}
