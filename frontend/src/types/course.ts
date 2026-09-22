export type Module = {
  id: string
  title: string
  subLessons: string[]
}

export type Course = {
  id: string
  category: string
  title: string
  description: string
  longDescription: string
  imageUrl: string
  lessonCount: number
  hourCount: number
  price: number
  modules: Module[]
}
