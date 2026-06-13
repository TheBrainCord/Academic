// Starter sketches for the Sketch Runner, one set per board. Pin numbers
// match the teaching pin sets in boards.ts (D13 / GPIO2 / GPIO17) so the
// "Blink" template lines up with the LED placement suggested elsewhere.

import type { BoardId } from '@/types/simulator'
import type { SketchLanguage } from './run-sketch'

export interface SketchTemplate {
  id: string
  label: string
  description: string
  code: string
}

const ARDUINO_BLINK = `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(13, HIGH);
  Serial.println("LED on");
  delay(1000);
  digitalWrite(13, LOW);
  Serial.println("LED off");
  delay(1000);
}
`

const ARDUINO_READ_SENSOR = `void setup() {
  pinMode(2, INPUT);
  Serial.begin(9600);
}

void loop() {
  int value = digitalRead(2);
  Serial.print("Sensor reading: ");
  Serial.println(value);
  delay(1000);
}
`

const ESP32_BLINK = `void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
}

void loop() {
  digitalWrite(2, HIGH);
  Serial.println("LED on");
  delay(1000);
  digitalWrite(2, LOW);
  Serial.println("LED off");
  delay(1000);
}
`

const ESP32_READ_SENSOR = `void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(34);
  Serial.print("Analog reading: ");
  Serial.println(value);
  delay(1000);
}
`

const PI_BLINK = `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(17, GPIO.OUT)

while True:
    GPIO.output(17, GPIO.HIGH)
    print("LED on")
    time.sleep(1)
    GPIO.output(17, GPIO.LOW)
    print("LED off")
    time.sleep(1)
`

const PI_READ_SENSOR = `import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)
GPIO.setup(4, GPIO.IN)

while True:
    value = GPIO.input(4)
    print("Sensor reading:", value)
    time.sleep(1)
`

const TEMPLATES_BY_BOARD: Record<BoardId, SketchTemplate[]> = {
  'arduino-uno': [
    { id: 'blink', label: 'Blink an LED (D13)', description: 'Toggle digital pin 13 on and off once a second.', code: ARDUINO_BLINK },
    { id: 'read-sensor', label: 'Read a sensor (D2)', description: 'Read a digital sensor on pin 2 and print it.', code: ARDUINO_READ_SENSOR },
  ],
  'esp32-devkit': [
    { id: 'blink', label: 'Blink an LED (GPIO2)', description: 'Toggle GPIO2 on and off once a second.', code: ESP32_BLINK },
    { id: 'read-sensor', label: 'Read an analog sensor (GPIO34)', description: 'Read the 12-bit ADC on GPIO34 and print it.', code: ESP32_READ_SENSOR },
  ],
  'raspberry-pi-4': [
    { id: 'blink', label: 'Blink an LED (GPIO17)', description: 'Toggle GPIO17 on and off once a second.', code: PI_BLINK },
    { id: 'read-sensor', label: 'Read a sensor (GPIO4)', description: 'Read a digital sensor on GPIO4 and print it.', code: PI_READ_SENSOR },
  ],
}

export function languageForBoard(boardId: BoardId): SketchLanguage {
  return boardId === 'raspberry-pi-4' ? 'micropython' : 'arduino-cpp'
}

export function getSketchTemplates(boardId: BoardId): SketchTemplate[] {
  return TEMPLATES_BY_BOARD[boardId]
}
