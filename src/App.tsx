import { useEffect, useMemo, useRef, useState } from 'react'
import { createScenario } from './scenarios'
import type { CarSpec, Direction, Turn } from './types'

type Page = 'quiz' | 'rules'

type Position = {
  left: number
  top: number
}

const START_POSITIONS: Record<Direction, Position> = {
  N: { left: 42.2, top: -18 },
  S: { left: 52.4, top: 108 },
  W: { left: -18, top: 52.4 },
  E: { left: 108, top: 42.2 },
}

const STOP_POSITIONS: Record<Direction, Position> = {
  N: { left: 42.2, top: 17.5 },
  S: { left: 52.4, top: 68.4 },
  W: { left: 17.5, top: 52.4 },
  E: { left: 68.4, top: 42.2 },
}

const CAR_ROTATION: Record<Direction, number> = {
  N: 180,
  E: 270,
  S: 0,
  W: 90,
}

const ARROW_FOR_MOVEMENT: Record<Direction, Record<Turn, string>> = {
  N: {
    straight: '↓',
    left: '→',
    right: '←',
  },
  S: {
    straight: '↑',
    left: '←',
    right: '→',
  },
  W: {
    straight: '→',
    left: '↑',
    right: '↓',
  },
  E: {
    straight: '←',
    left: '↓',
    right: '↑',
  },
}

const DIRECTION_NAME: Record<Direction, string> = {
  N: 'north',
  E: 'east',
  S: 'south',
  W: 'west',
}

function formatOrdinal(index: number) {
  return ['1st', '2nd', '3rd', '4th'][index] ?? `${index + 1}th`
}

function Car({
  car,
  hasArrived,
  selectedIndex,
  result,
  onSelect,
}: {
  car: CarSpec
  hasArrived: boolean
  selectedIndex: number
  result: 'correct' | 'wrong' | null
  onSelect: () => void
}) {
  const position = hasArrived ? STOP_POSITIONS[car.direction] : START_POSITIONS[car.direction]
  const isHorizontal = car.direction === 'E' || car.direction === 'W'

  return (
    <button
      type="button"
      className={`car-button ${isHorizontal ? 'horizontal' : ''} ${
        selectedIndex >= 0 ? 'selected' : ''
      } ${result ?? ''}`}
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
      }}
      onClick={onSelect}
      aria-label={`Car ${car.id}, approaching from the ${DIRECTION_NAME[car.direction]}, going ${car.turn}`}
    >
      <div
        className="car-graphic"
        style={{ transform: `rotate(${CAR_ROTATION[car.direction]}deg)` }}
        aria-hidden="true"
      >
        <div className="car-hood" />
        <div className="car-windshield" />
        <div className="car-roof" />
        <div className="car-rear-window" />
        <div className="car-trunk" />
        <div className="wheel wheel-fl" />
        <div className="wheel wheel-fr" />
        <div className="wheel wheel-rl" />
        <div className="wheel wheel-rr" />
      </div>

      <div className="car-label">
        <span className="car-letter">{car.id}</span>
        <span className="movement-arrow" aria-hidden="true">
          {ARROW_FOR_MOVEMENT[car.direction][car.turn]}
        </span>
      </div>

      {selectedIndex >= 0 && <span className="order-badge">{selectedIndex + 1}</span>}
    </button>
  )
}

function App() {
  const [page, setPage] = useState<Page>('quiz')
  const [scenario, setScenario] = useState(createScenario)
  const [selected, setSelected] = useState<string[]>([])
  const [arrivedCars, setArrivedCars] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<string>('Watch the cars approach the intersection.')
  const [attempts, setAttempts] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [scenarioNumber, setScenarioNumber] = useState(1)
  const [checked, setChecked] = useState(false)
  const timersRef = useRef<number[]>([])

  const resultByCar = useMemo(() => {
    if (!checked) return new Map<string, 'correct' | 'wrong'>()

    return new Map(
      scenario.cars.map((car) => {
        const chosenIndex = selected.indexOf(car.id)
        const correctIndex = scenario.correctOrder.indexOf(car.id)
        return [car.id, chosenIndex === correctIndex ? 'correct' : 'wrong'] as const
      }),
    )
  }, [checked, scenario, selected])

  function clearTimers() {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  function replayScenario() {
    clearTimers()
    setSelected([])
    setChecked(false)
    setArrivedCars(new Set())
    setFeedback('Watch the cars approach the intersection. Arrival order matters.')

    scenario.cars.forEach((car) => {
      const timer = window.setTimeout(() => {
        setArrivedCars((current) => new Set([...current, car.id]))
      }, 400 + car.arrivalSeconds * 1000)
      timersRef.current.push(timer)
    })

    const finalArrival = Math.max(...scenario.cars.map((car) => car.arrivalSeconds))
    const detailTimer = window.setTimeout(() => {
      setFeedback(
        scenario.cars
          .slice()
          .sort((a, b) => a.arrivalSeconds - b.arrivalSeconds)
          .map(
            (car) =>
              `Car ${car.id}: ${DIRECTION_NAME[car.direction]} approach, ${car.turn}, ${car.arrivalSeconds.toFixed(1)}s`,
          )
          .join(' · '),
      )
    }, 700 + finalArrival * 1000)
    timersRef.current.push(detailTimer)
  }

  useEffect(() => {
    replayScenario()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario])

  function selectCar(id: string) {
    if (checked) return
    setSelected((current) => {
      if (current.includes(id) || current.length >= scenario.cars.length) return current
      return [...current, id]
    })
  }

  function checkAnswer() {
    if (selected.length !== scenario.cars.length) {
      setFeedback(`Select all ${scenario.cars.length} cars before checking your answer.`)
      return
    }

    const isCorrect = scenario.correctOrder.every((id, index) => selected[index] === id)
    setAttempts((value) => value + 1)
    setChecked(true)

    if (isCorrect) {
      setCorrect((value) => value + 1)
      setFeedback(`Correct. ${scenario.explanation}`)
    } else {
      const order = scenario.correctOrder
        .map((id, index) => `${formatOrdinal(index)}: Car ${id}`)
        .join(', ')
      setFeedback(`Not quite. Correct order: ${order}. ${scenario.explanation}`)
    }
  }

  function newScenario() {
    clearTimers()
    setScenario(createScenario())
    setScenarioNumber((value) => value + 1)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <h1>4-Way Stop Trainer</h1>
          <p>Practice right-of-way decisions at a U.S. four-way stop.</p>
        </div>
        <nav>
          <button className={page === 'quiz' ? 'active' : ''} onClick={() => setPage('quiz')}>
            Quiz
          </button>
          <button className={page === 'rules' ? 'active' : ''} onClick={() => setPage('rules')}>
            4-Way Stop Rules
          </button>
        </nav>
      </header>

      {page === 'quiz' ? (
        <section className="quiz-page">
          <div className="stats-grid">
            <div className="stat-card"><span>Scenario</span><strong>{scenarioNumber}</strong></div>
            <div className="stat-card"><span>Correct</span><strong>{correct}</strong></div>
            <div className="stat-card"><span>Attempts</span><strong>{attempts}</strong></div>
            <div className="stat-card"><span>Cars</span><strong>{scenario.cars.length}</strong></div>
          </div>

          <div className="instruction-card">
            <strong>Click the cars in the order they should go.</strong>
            <span>{feedback}</span>
          </div>

          <div className="intersection" aria-label="Overhead view of a four-way stop intersection">
            <div className="grass nw" />
            <div className="grass ne" />
            <div className="grass sw" />
            <div className="grass se" />
            <div className="road vertical" />
            <div className="road horizontal" />
            <div className="intersection-center" />
            <div className="lane-divider vertical-line" />
            <div className="lane-divider horizontal-line" />

            <div className="stop-line north" />
            <div className="stop-line south" />
            <div className="stop-line west" />
            <div className="stop-line east" />

            <div className="stop-sign north-sign">STOP</div>
            <div className="stop-sign south-sign">STOP</div>
            <div className="stop-sign west-sign">STOP</div>
            <div className="stop-sign east-sign">STOP</div>

            {scenario.cars.map((car) => (
              <Car
                key={car.id}
                car={car}
                hasArrived={arrivedCars.has(car.id)}
                selectedIndex={selected.indexOf(car.id)}
                result={resultByCar.get(car.id) ?? null}
                onSelect={() => selectCar(car.id)}
              />
            ))}
          </div>

          <div className="selection-row" aria-live="polite">
            <strong>Your order:</strong>
            {selected.length === 0 ? (
              <span className="muted">No cars selected.</span>
            ) : (
              selected.map((id, index) => (
                <span className="selection-chip" key={id}>
                  {index + 1}. Car {id}
                </span>
              ))
            )}
          </div>

          <div className="controls">
            <button onClick={replayScenario}>Replay arrivals</button>
            <button
              onClick={() => {
                setSelected([])
                setChecked(false)
                setFeedback('Selections cleared. Choose the cars again.')
              }}
            >
              Clear choices
            </button>
            <button className="primary" onClick={checkAnswer}>Check answer</button>
            <button onClick={newScenario}>New scenario</button>
          </div>
        </section>
      ) : (
        <section className="rules-page">
          <h2>Rules of a U.S. 4-way stop</h2>
          <p>
            These are the standard rules used by this trainer. State law and unusual road conditions can vary,
            and drivers must always yield to pedestrians, emergency vehicles, traffic officers, and any immediate hazard.
          </p>

          <ol className="rules-list">
            <li><strong>Stop completely.</strong> Stop at the stop line, before the crosswalk, or before entering the intersection.</li>
            <li><strong>First to arrive goes first.</strong> When vehicles arrive at different times, the first vehicle to reach and stop at the intersection proceeds first.</li>
            <li><strong>If arrival is simultaneous, yield to the vehicle on your right.</strong> If two drivers arrive at about the same time on crossing roads, the driver with another vehicle to the right yields.</li>
            <li><strong>Left turns yield to opposing traffic.</strong> If opposing vehicles arrive together, a driver turning left yields to an opposing vehicle going straight or turning right.</li>
            <li><strong>Avoid collisions even if you have the right-of-way.</strong> If another driver moves unexpectedly, safety takes priority.</li>
          </ol>

          <p className="rules-note">
            The quiz avoids scenarios in which two non-conflicting vehicles could reasonably proceed at the same time, so every question has one clear first/second/third/fourth ordering.
          </p>

          <button className="primary" onClick={() => setPage('quiz')}>Back to quiz</button>
        </section>
      )}
    </main>
  )
}

export default App
