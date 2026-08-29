import type { HardwareBoard } from '@/types/hardware'

export const HARDWARE_BOARDS = [
  {
    id: 'arduino-uno', name: 'Arduino Uno Rev3', platform: 'Arduino',
    electrical: { supplyVoltage: '5 V USB or regulated input per board specification', logicVoltage: '5 V', recommendedGpioCurrentMa: 10, cautions: ['Use 20 mA or less per GPIO as a design ceiling; 40 mA is an absolute maximum, not a target.', 'Disconnect power before moving wires.'] },
    pins: [
      { id: 'd8', labels: ['D8', 'digital pin 8'], capabilities: ['digital-input', 'digital-output'] },
      { id: 'gnd', labels: ['GND'], capabilities: ['ground'] },
      { id: '5v', labels: ['5V'], capabilities: ['power'] },
    ],
  },
  {
    id: 'esp32-devkit-v1', name: 'ESP32 DevKit V1', platform: 'ESP-IDF / Arduino',
    electrical: { supplyVoltage: '5 V at USB/VIN; regulated 3.3 V logic rail', logicVoltage: '3.3 V only', recommendedGpioCurrentMa: 8, cautions: ['GPIO is not 5 V tolerant.', 'Avoid boot-strapping pins for a first circuit; GPIO18 is used here.', 'Board variants have different labels: verify the silkscreen and pinout.'] },
    pins: [
      { id: 'gpio18', labels: ['GPIO18', '18'], capabilities: ['digital-input', 'digital-output', 'pwm'] },
      { id: 'gnd', labels: ['GND'], capabilities: ['ground'] },
      { id: '3v3', labels: ['3V3'], capabilities: ['power'] },
    ],
  },
  {
    id: 'raspberry-pi', name: 'Raspberry Pi with 40-pin header', platform: 'Linux / Raspberry Pi OS',
    electrical: { supplyVoltage: 'Board-specific USB supply; 3.3 V GPIO rail', logicVoltage: '3.3 V only', recommendedGpioCurrentMa: 8, cautions: ['GPIO is not 5 V tolerant.', 'Pin numbers can mean BCM GPIO or physical header position; this lesson states both.', 'Shut down and remove power before rewiring the header.'] },
    pins: [
      { id: 'bcm17', labels: ['GPIO17', 'BCM17'], physicalPin: 11, capabilities: ['digital-input', 'digital-output'] },
      { id: 'gnd-6', labels: ['GND'], physicalPin: 6, capabilities: ['ground'] },
      { id: '3v3-1', labels: ['3V3'], physicalPin: 1, capabilities: ['power'] },
    ],
  },
] as const satisfies readonly HardwareBoard[]

export const HARDWARE_BOARD_BY_ID = Object.fromEntries(HARDWARE_BOARDS.map((board) => [board.id, board]))
