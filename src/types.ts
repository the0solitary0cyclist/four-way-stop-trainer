export type Direction = 'N' | 'E' | 'S' | 'W'
export type Turn = 'straight' | 'left' | 'right'

export type CarSpec = {
  id: string
  direction: Direction
  turn: Turn
  arrivalSeconds: number
}

export type Scenario = {
  cars: CarSpec[]
  correctOrder: string[]
  explanation: string
}
