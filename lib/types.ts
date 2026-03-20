export interface Car {
  id: string
  name: string
  brand: string
  type: 'Sports' | 'Electric' | 'SUV' | 'Sedan' | 'Luxury' | 'Hatchback' | 'Pickup'
  fuelType: 'Petrol' | 'Electric' | 'Hybrid'
  horsepower: number
  torque: number
  acceleration: number
  topSpeed: number
  mileage: string
  engine: string
  price: number
  year: number
  image: string
  gallery: string[]
  rating: number
  views: number
  favorites: number
  featured?: boolean
  description: string
  drivetrain: 'RWD' | 'AWD' | 'FWD'
  seats: number
  weight: number
}
