package events

import "sync"

// Broadcaster is a simple fan-out pub/sub hub.
// Subscribers receive an empty struct on every Notify call.
type Broadcaster struct {
	mu      sync.Mutex
	clients map[chan struct{}]struct{}
}

func NewBroadcaster() *Broadcaster {
	return &Broadcaster{clients: make(map[chan struct{}]struct{})}
}

// Subscribe returns a channel that receives a signal on each Notify.
func (b *Broadcaster) Subscribe() chan struct{} {
	b.mu.Lock()
	defer b.mu.Unlock()
	ch := make(chan struct{}, 1)
	b.clients[ch] = struct{}{}
	return ch
}

// Unsubscribe removes the channel and closes it.
func (b *Broadcaster) Unsubscribe(ch chan struct{}) {
	b.mu.Lock()
	defer b.mu.Unlock()
	delete(b.clients, ch)
	close(ch)
}

// Notify sends a signal to all current subscribers (non-blocking).
func (b *Broadcaster) Notify() {
	b.mu.Lock()
	defer b.mu.Unlock()
	for ch := range b.clients {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}
