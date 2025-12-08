package presenters

import (
	"encoding/json"
	"net/http"
)

type HTTPProvider[T any] struct {
	r          *http.Request
	w          http.ResponseWriter
	statusCode *int
	data       *T
	err        error
}

type Response[T any] struct {
	Data T `json:"data"`
}

type Error struct {
	Message string `json:"message"`
}

func NewHTTPPresenter[T any](r *http.Request, w http.ResponseWriter) *HTTPProvider[T] {
	return &HTTPProvider[T]{r: r, w: w}
}

func (p *HTTPProvider[T]) WithStatusCode(code int) *HTTPProvider[T] {
	p.statusCode = &code
	return p
}

func (p *HTTPProvider[T]) WithData(data T) *HTTPProvider[T] {
	p.data = &data
	return p
}

func (p *HTTPProvider[T]) WithError(err error) *HTTPProvider[T] {
	p.err = err
	return p
}

func (p *HTTPProvider[T]) Present() {
	if p.err != nil {
		http.Error(p.w, p.err.Error(), http.StatusInternalServerError)
		return
	}

	statusCode := http.StatusOK
	if p.statusCode != nil {
		statusCode = *p.statusCode
	}

	p.w.Header().Set("Content-Type", "application/json")
	p.w.WriteHeader(statusCode)

	if p.data == nil {
		return
	}
	resp := Response[T]{Data: *p.data}
	err := json.NewEncoder(p.w).Encode(resp)
	if err != nil {
		http.Error(p.w, err.Error(), http.StatusInternalServerError)
		return
	}
}
