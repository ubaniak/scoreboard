package entities

type DeviceStatus string

const (
	DeviceStatusUnknown   DeviceStatus = "unknown"
	DeviceStatusOffline   DeviceStatus = "offline"
	DeviceStatusConnected DeviceStatus = "connected"
)

type StatusProfile struct {
	ID     uint
	Role   string
	Status DeviceStatus
}
