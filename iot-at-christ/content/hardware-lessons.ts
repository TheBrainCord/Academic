import type { BoardId, ComponentId } from '@/types/simulator'

export interface HardwareStep {
  title: string
  instruction: string
  connection: string
  concept: string
  logic: string
  evidence: string
}

export interface HardwareLesson {
  id: string
  eyebrow: string
  title: string
  summary: string
  duration: number
  component: ComponentId
  actuator: ComponentId
  steps: HardwareStep[]
}

export const HARDWARE_LESSONS: HardwareLesson[] = [
  {
    id: 'sense-think-act',
    eyebrow: 'Hardware studio · Lesson 01',
    title: 'Sense, think, act',
    summary: 'Build a temperature-to-alert circuit and trace energy and information through a real IoT system.',
    duration: 18,
    component: 'dht11',
    actuator: 'led',
    steps: [
      { title: 'Choose the controller', instruction: 'Compare the three boards, then choose the controller that will interpret the sensor.', connection: 'No wires yet — identify voltage and GPIO constraints first.', concept: 'A controller is the decision-making layer.', logic: 'The same behaviour can run on different hardware, but pin and voltage rules change.', evidence: 'Read the printed logic-voltage and ADC facts for the selected board.' },
      { title: 'Share a reference', instruction: 'Add the sensor ground connection. Every voltage needs a common reference.', connection: 'DHT11 GND → board GND', concept: 'Ground is the circuit’s shared zero-volt reference.', logic: 'Without a common reference, HIGH and LOW have no reliable meaning.', evidence: 'The validator confirms a continuous return path.' },
      { title: 'Deliver power', instruction: 'Power the DHT11 from a rail compatible with the selected board.', connection: 'DHT11 VCC → 3.3V (or 5V on Uno)', concept: 'Power carries energy; it is not sensor data.', logic: 'The sensor requires a supply inside its rated range.', evidence: 'The power path glows amber and the sensor reading becomes available.' },
      { title: 'Carry the signal', instruction: 'Connect DATA to a digital GPIO so the controller can receive measurements.', connection: 'DHT11 DATA → digital GPIO', concept: 'A signal encodes information as changing voltage.', logic: 'Firmware samples the data pin, compares temperature with a threshold, then decides.', evidence: 'Change temperature and watch packets reach the controller.' },
      { title: 'Add an output', instruction: 'Complete the system with an LED alert output and current limiting.', connection: 'GPIO → 220Ω resistor → LED → GND', concept: 'An actuator turns a decision into a physical effect.', logic: 'IF temperature ≥ threshold, THEN drive the output HIGH.', evidence: 'The LED visibly turns on only when the simulated condition is true.' },
    ],
  },
]

export const HARDWARE_BOARD_IDS: BoardId[] = ['arduino-uno', 'esp32-devkit', 'raspberry-pi-4']

export function getHardwareLesson(id: string) {
  return HARDWARE_LESSONS.find((lesson) => lesson.id === id)
}
