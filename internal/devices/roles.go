package devices

type Role string

const (
	Judge1Role Role = "judge1"
	Judge2Role Role = "judge2"
	Judge3Role Role = "judge3"
	Judge4Role Role = "judge4"
	Judge5Role Role = "judge5"
	AdminRole  Role = "admin"
)

func (r Role) Validate() bool {
	switch r {
	case Judge1Role:
		return true
	case Judge2Role:
		return true
	case Judge3Role:
		return true
	case Judge4Role:
		return true
	case Judge5Role:
		return true
	case AdminRole:
		return true
	}
	return false
}

var JudgeRoles = []Role{
	Judge1Role,
	Judge2Role,
	Judge3Role,
	Judge4Role,
	Judge5Role,
}

var Limits = map[Role]int{
	Judge1Role: 1,
	Judge2Role: 1,
	Judge3Role: 1,
	Judge4Role: 1,
	Judge5Role: 1,
	AdminRole:  1,
}
