/** Category filter tabs shown in the UI. */
export const types = ['All', 'SUV', 'Sedan', 'Sports', 'Electric', 'Luxury', 'Hatchback', 'Pickup'] as const

export type CarType = (typeof types)[number]
