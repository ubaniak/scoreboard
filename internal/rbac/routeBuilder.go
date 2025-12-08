package rbac

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gorilla/mux"
)

type RouteBuilder struct {
	pathPrefix string
	route      *mux.Router
	rbacSrv    *RbacService
	labels     map[string]string
}

func NewRouteBuilder(route *mux.Router, rbacSrv *RbacService) *RouteBuilder {
	return &RouteBuilder{route: route, pathPrefix: "/", rbacSrv: rbacSrv, labels: make(map[string]string)}
}

func (rb *RouteBuilder) WithMiddleware(mw ...mux.MiddlewareFunc) *RouteBuilder {
	rb.route.Use(mw...)
	return rb
}

func (rb *RouteBuilder) AddRoute(label, path string, method string, handler http.HandlerFunc, roles ...string) error {

	if len(roles) == 0 {
		rb.route.Handle(path, handler).Methods(method)
	} else {
		wrapped := rb.rbacSrv.JWTMiddleware(roles...)(handler)
		rb.route.Handle(path, wrapped).Methods(method)
	}

	fullPath, err := url.JoinPath(rb.pathPrefix, path)
	if err != nil {
		return err
	}
	decodeUrl, err := url.QueryUnescape(fullPath)
	if err != nil {
		return err
	}
	rb.labels[label] = decodeUrl

	return nil
}

func (rb *RouteBuilder) AddSubroute(sr string) *RouteBuilder {
	p, err := url.JoinPath(rb.pathPrefix, sr)
	if err != nil {
		panic(fmt.Sprintf("error joining path: (%s, %s), %v", rb.pathPrefix, sr, err))
	}

	if !strings.HasSuffix(sr, "/") {
		sr = "/" + sr
	}

	r := rb.route.PathPrefix(sr).Subrouter()

	return &RouteBuilder{
		pathPrefix: p,
		labels:     rb.labels,
		route:      r,
		rbacSrv:    rb.rbacSrv,
	}
}
