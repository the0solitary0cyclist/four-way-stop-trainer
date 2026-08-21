import type { CarSpec, Direction, Scenario, Turn } from './types'

const DIRECTIONS: Direction[] = ['N', 'E', 'S', 'W']
const LABELS = ['A', 'B', 'C', 'D']
const TURNS: Turn[] = ['straight', 'left', 'right']

const rightNeighbor: Record<Direction, Direction> = {
  N: 'W',
  W: 'S',
  S: 'E',
  E: 'N',
}

const opposite: Record<Direction, Direction> = {
  N: 'S',
  S: 'N',
  E: 'W',
  W: 'E',
}

const fullDirection: Record<Direction, string> = {
  N: 'north',
  E: 'east',
  S: 'south',
  W: 'west',
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function randomTurn(): Turn {
  return TURNS[Math.floor(Math.random() * TURNS.length)]
}

function makeStaggeredScenario(): Scenario {
  const count = 2 + Math.floor(Math.random() * 3)
  const directions = shuffle(DIRECTIONS).slice(0, count)

  const cars: CarSpec[] = directions.map((direction, index) => ({
    id: LABELS[index],
    direction,
    turn: randomTurn(),
    arrivalSeconds: index * 1.5 + Math.random() * 0.25,
  }))

  return {
    cars,
    correctOrder: [...cars]
      .sort((a, b) => a.arrivalSeconds - b.arrivalSeconds)
      .map((car) => car.id),
    explanation:
      'The vehicles arrived at different times, so they proceed in the order in which they reached and stopped at the intersection.',
  }
}

function makeRightHandTieScenario(): Scenario {
  const pairs: [Direction, Direction][] = [
    ['N', 'W'],
    ['W', 'S'],
    ['S', 'E'],
    ['E', 'N'],
  ]

  const pair = pairs[Math.floor(Math.random() * pairs.length)]
  const count = 2 + Math.floor(Math.random() * 3)
  const remaining = shuffle(DIRECTIONS.filter((direction) => !pair.includes(direction))).slice(
    0,
    count - 2,
  )
  const directions = [...pair, ...remaining]

  const cars: CarSpec[] = directions.map((direction, index) => ({
    id: LABELS[index],
    direction,
    turn: randomTurn(),
    arrivalSeconds: index < 2 ? 0.9 : 2.7 + (index - 2) * 1.5,
  }))

  const firstDirection = rightNeighbor[pair[0]] === pair[1] ? pair[1] : pair[0]
  const secondDirection = pair.find((direction) => direction !== firstDirection)!

  const firstCar = cars.find((car) => car.direction === firstDirection)!
  const secondCar = cars.find((car) => car.direction === secondDirection)!
  const later = cars
    .filter((car) => car.arrivalSeconds > 0.9)
    .sort((a, b) => a.arrivalSeconds - b.arrivalSeconds)
    .map((car) => car.id)

  return {
    cars,
    correctOrder: [firstCar.id, secondCar.id, ...later],
    explanation: `The first two vehicles arrived together. The ${fullDirection[secondDirection]} vehicle had the ${fullDirection[firstDirection]} vehicle on its right, so it yielded.`,
  }
}

function makeLeftTurnTieScenario(): Scenario {
  const pair: [Direction, Direction] = Math.random() < 0.5 ? ['N', 'S'] : ['E', 'W']
  const leftTurnDirection = pair[Math.floor(Math.random() * pair.length)]
  const opposingDirection = opposite[leftTurnDirection]
  const count = 2 + Math.floor(Math.random() * 3)
  const remaining = shuffle(DIRECTIONS.filter((direction) => !pair.includes(direction))).slice(
    0,
    count - 2,
  )

  const cars: CarSpec[] = [
    {
      id: 'A',
      direction: leftTurnDirection,
      turn: 'left',
      arrivalSeconds: 0.9,
    },
    {
      id: 'B',
      direction: opposingDirection,
      turn: Math.random() < 0.7 ? 'straight' : 'right',
      arrivalSeconds: 0.9,
    },
    ...remaining.map((direction, index) => ({
      id: LABELS[index + 2],
      direction,
      turn: randomTurn(),
      arrivalSeconds: 2.7 + index * 1.5,
    })),
  ]

  const leftTurnCar = cars.find((car) => car.direction === leftTurnDirection)!
  const opposingCar = cars.find((car) => car.direction === opposingDirection)!
  const later = cars
    .filter((car) => car.arrivalSeconds > 0.9)
    .sort((a, b) => a.arrivalSeconds - b.arrivalSeconds)
    .map((car) => car.id)

  return {
    cars,
    correctOrder: [opposingCar.id, leftTurnCar.id, ...later],
    explanation: `The opposing vehicles arrived together. Car ${leftTurnCar.id} was turning left, so it yielded to Car ${opposingCar.id}.`,
  }
}

export function createScenario(): Scenario {
  const roll = Math.random()
  if (roll < 0.5) return makeStaggeredScenario()
  if (roll < 0.78) return makeRightHandTieScenario()
  return makeLeftTurnTieScenario()
}
