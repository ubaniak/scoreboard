package storage

type Comment struct {
	ID         uint `gorm:"primaryKey"`
	Comment    string
	EntityKind string
	EntityID   uint
}
