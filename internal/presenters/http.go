package presenters

import (
	"encoding/json"
	"log"
	"net/http"
)

type HTTPProvider[T any] struct {
	r             *http.Request
	w             http.ResponseWriter
	statusCode    *int
	errStatusCode *int
	data          *T
	err           error
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

// WithStatusCode sets the status code used on a successful response. It has
// no effect when Present() ends up taking the error path — use
// WithErrorStatusCode for that.
func (p *HTTPProvider[T]) WithStatusCode(code int) *HTTPProvider[T] {
	p.statusCode = &code
	return p
}

// WithErrorStatusCode sets the status code used when Present() takes the
// error path (WithError was given a non-nil error). Defaults to 400.
func (p *HTTPProvider[T]) WithErrorStatusCode(code int) *HTTPProvider[T] {
	p.errStatusCode = &code
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

func (p *HTTPProvider[T]) sendError(toSend error) {
	resp := Error{toSend.Error()}
	err := json.NewEncoder(p.w).Encode(resp)
	if err != nil {
		http.Error(p.w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (p *HTTPProvider[T]) Present() {
	if p.err != nil {
		statusCode := http.StatusBadRequest
		if p.errStatusCode != nil {
			statusCode = *p.errStatusCode
		}
		log.Printf("ERROR %s %s: %v", p.r.Method, p.r.URL.Path, p.err)
		http.Error(p.w, p.err.Error(), statusCode)
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
